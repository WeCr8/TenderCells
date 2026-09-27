"""Run a Hugging Face LeRobot policy (ACT, Diffusion, SmolVLA, pi0, ...) from the Hub.

Uses LeRobot's own command-line tools rather than their internal Python API
(which changes between releases):

  live        lerobot-rollout --strategy.type=base --policy.path=<repo> \\
                  --robot.type=... --robot.port=... --robot.id=... --task=... --duration=N
  simulation  lerobot-eval --policy.path=<repo> --env.type=<pusht|aloha|libero|metaworld> \\
                  --eval.n_episodes=1

Farming examples: "lerobot/smolvla_base" with task "pick the ripe tomato and
place it in the basket", or your own ACT policy trained on egg pick-and-place.

Safety: a run has a hard time limit, E-STOP kills it immediately, only one run
at a time, and inputs are validated and passed as an argument list (no shell).
"""

from __future__ import annotations

import re
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass, field
from typing import Callable, List, Optional

REPO_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}/[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$")
SIM_ENVS = ("pusht", "aloha", "libero", "metaworld")
MAX_DURATION_S = 600


class PolicyError(ValueError):
    """Bad policy request (reported back to the user)."""


@dataclass
class PolicyRequest:
    repo_id: str
    task: str = ""
    duration_s: int = 30
    sim_env: str = "pusht"

    def validate(self) -> "PolicyRequest":
        if not REPO_ID_RE.match(self.repo_id or ""):
            raise PolicyError("repo_id must be a Hugging Face model id like 'lerobot/smolvla_base'")
        task = (self.task or "").strip()
        if len(task) > 200 or any(ch in task for ch in "\r\n\x00"):
            raise PolicyError("task must be one line of at most 200 characters")
        self.task = task
        self.duration_s = int(self.duration_s)
        if not 1 <= self.duration_s <= MAX_DURATION_S:
            raise PolicyError(f"duration_s must be between 1 and {MAX_DURATION_S}")
        if self.sim_env not in SIM_ENVS:
            raise PolicyError(f"sim_env must be one of {', '.join(SIM_ENVS)}")
        return self


@dataclass
class PolicyStatus:
    state: str = "idle"  # idle | running | finished | failed | stopped
    repo_id: Optional[str] = None
    task: Optional[str] = None
    mode: Optional[str] = None
    started_at: Optional[float] = None
    message: str = ""
    log_tail: List[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "state": self.state, "repoId": self.repo_id, "task": self.task, "mode": self.mode,
            "startedAt": self.started_at, "message": self.message, "log": self.log_tail[-8:],
        }


def build_command(req: PolicyRequest, simulated: bool, robot_args: List[str]) -> List[str]:
    """argv for the LeRobot CLI (no shell involved)."""
    if simulated:
        return ["lerobot-eval", f"--policy.path={req.repo_id}", f"--env.type={req.sim_env}",
                "--eval.n_episodes=1", "--eval.batch_size=1"]
    if not robot_args:
        raise PolicyError("Live policy runs need a LeRobot arm (ARM_TYPE=lerobot)")
    cmd = ["lerobot-rollout", "--strategy.type=base", f"--policy.path={req.repo_id}", *robot_args,
           f"--duration={req.duration_s}"]
    if req.task:
        cmd.append(f"--task={req.task}")
    return cmd


class PolicyRunner:
    def __init__(self, on_status: Callable[[dict], None] = lambda s: None,
                 popen: Callable[..., subprocess.Popen] = subprocess.Popen,
                 which: Callable[[str], Optional[str]] = shutil.which):
        self.status = PolicyStatus()
        self._on_status = on_status
        self._popen = popen
        self._which = which
        self._proc: Optional[subprocess.Popen] = None
        self._lock = threading.Lock()

    @property
    def running(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    def _emit(self) -> None:
        self._on_status(self.status.as_dict())

    def start(self, req: PolicyRequest, simulated: bool, robot_args: List[str],
              before: Callable[[], None] = lambda: None, after: Callable[[], None] = lambda: None) -> None:
        """Start a run in the background.

        :param before: called first (the service releases the arm's serial port here).
        :param after:  called when the run ends for any reason (service reconnects the arm).
        :raises PolicyError: invalid request, already running, or LeRobot not installed.
        """
        req.validate()
        cmd = build_command(req, simulated, robot_args)
        with self._lock:
            if self.running:
                raise PolicyError("A policy is already running - stop it first")
            if not self._which(cmd[0]):
                raise PolicyError(f"{cmd[0]} not found. Install LeRobot on the controller (Python 3.12+): "
                                  'pip install "lerobot[smolvla,feetech]"')
            before()
            try:
                self._proc = self._popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            except Exception:
                after()
                raise
            self.status = PolicyStatus("running", req.repo_id, req.task, "simulation" if simulated else "live",
                                       time.time(), " ".join(cmd[:2]))
        self._emit()
        threading.Thread(target=self._watch, args=(self._proc, req.duration_s + 30, after), daemon=True).start()

    def _watch(self, proc: subprocess.Popen, timeout_s: float, after: Callable[[], None]) -> None:
        deadline = time.time() + timeout_s
        try:
            if proc.stdout is not None:
                for line in proc.stdout:
                    self.status.log_tail = (self.status.log_tail + [line.rstrip()[:200]])[-40:]
                    if time.time() > deadline:
                        proc.kill()
                        break
            code = proc.wait(timeout=max(1.0, deadline - time.time()))
            if self.status.state == "running":
                self.status.state = "finished" if code == 0 else "failed"
                self.status.message = "Policy run finished" if code == 0 else f"LeRobot exited with code {code}"
        except subprocess.TimeoutExpired:
            proc.kill()
            self.status.state, self.status.message = "failed", "Policy run exceeded its time limit and was stopped"
        finally:
            with self._lock:
                if self._proc is proc:
                    self._proc = None
            after()
            self._emit()

    def stop(self, reason: str = "Stopped by user") -> bool:
        """Stop the current run (E-STOP uses this too). Returns True if one was running."""
        with self._lock:
            proc = self._proc
        if proc is None or proc.poll() is not None:
            return False
        self.status.state, self.status.message = "stopped", reason
        proc.kill()  # SIGKILL: LeRobot stops streaming actions at once
        return True

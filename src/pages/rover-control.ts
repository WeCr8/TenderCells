// Rover Control page (#rover-control): on-screen dual-stick pad, E-stop,
// configurable aux toggles and Bluetooth gamepad support. Landscape-first,
// phone + tablet. See src/rover/control-core.ts for the wire protocol.
import '../rover/rover-control.css';
import { DEFAULT_TOGGLES, SPEED_MODES, readGamepad, sanitizeToggles } from '../rover/control-core';
import type { ControllerType, GamepadSample, SpeedMode, StickState, ToggleDef } from '../rover/control-core';
import { RoverSession } from '../rover/session';
import type { RoverTransport, SessionSnapshot } from '../rover/session';
import { DemoTransport, MqttWsTransport, normalizeBrokerUrl } from '../rover/transport';

const LS_KEY = 'tc.rover.settings.v1';

interface Settings {
  transport: 'mqtt' | 'demo';
  brokerUrl: string;
  username: string;
  deviceId: string;
  controllerType: ControllerType;
  speedMode: SpeedMode;
  toggles: ToggleDef[];
}

function loadSettings(): Settings {
  let raw: Record<string, unknown> = {};
  try {
    raw = (JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Record<string, unknown>) || {};
  } catch {
    raw = {};
  }
  return {
    transport: raw.transport === 'mqtt' ? 'mqtt' : 'demo',
    brokerUrl: typeof raw.brokerUrl === 'string' ? raw.brokerUrl : '',
    username: typeof raw.username === 'string' ? raw.username : '',
    deviceId: typeof raw.deviceId === 'string' ? raw.deviceId : '',
    controllerType: raw.controllerType === 'tank' ? 'tank' : 'arcade',
    speedMode: typeof raw.speedMode === 'string' && raw.speedMode in SPEED_MODES ? (raw.speedMode as SpeedMode) : 'normal',
    toggles: sanitizeToggles(raw.toggles ?? DEFAULT_TOGGLES),
  };
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* storage full / private mode: settings just won't persist */
  }
}

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function createRoverControlPage(): string {
  return `<div id="roverPad" class="rp-root" role="application" aria-label="Rover control pad">
  <div class="rp-portrait-hint">Rotate to landscape for the control pad</div>
  <header class="rp-top">
    <button class="rp-btn rp-exit" id="rpExit" aria-label="Exit rover control">✕</button>
    <span class="rp-pill" id="rpLink">offline</span>
    <span class="rp-dev" id="rpDev"></span>
    <span class="rp-gp" id="rpGp" hidden>🎮</span>
    <span class="rp-cmd" id="rpCmd">stop</span>
    <button class="rp-btn" id="rpConnect">Connect</button>
    <button class="rp-btn" id="rpSettings" aria-label="Settings">⚙︎</button>
  </header>
  <main class="rp-main">
    <div class="rp-stick-wrap"><div class="rp-stick" id="rpStickL" data-side="left"><div class="rp-knob"></div><span class="rp-stick-label" id="rpLblL"></span></div></div>
    <section class="rp-center">
      <button class="rp-estop" id="rpEstop" aria-label="Emergency stop">E-STOP</button>
      <div class="rp-modes">
        <button class="rp-btn rp-mode" id="rpType"></button>
        <button class="rp-btn rp-mode" id="rpSpeed"></button>
      </div>
      <div class="rp-toggles" id="rpToggles"></div>
      <div class="rp-msg" id="rpMsg" aria-live="polite"></div>
    </section>
    <div class="rp-stick-wrap"><div class="rp-stick" id="rpStickR" data-side="right"><div class="rp-knob"></div><span class="rp-stick-label" id="rpLblR"></span></div></div>
  </main>
  <dialog class="rp-dialog" id="rpDialog">
    <form method="dialog" class="rp-form" id="rpForm">
      <h2>Rover connection</h2>
      <label>Mode
        <select name="transport"><option value="demo">Demo (no rover)</option><option value="mqtt">Rover via local MQTT broker</option></select>
      </label>
      <label>Broker (WebSocket) <input name="brokerUrl" placeholder="192.168.1.100:9001" autocomplete="off" autocapitalize="off"></label>
      <label>Broker user <input name="username" autocomplete="off" autocapitalize="off"></label>
      <label>Broker password <input name="password" type="password" autocomplete="off"></label>
      <label>Rover device ID <input name="deviceId" placeholder="from the rover's serial banner" autocomplete="off" autocapitalize="off"></label>
      <label>Controller
        <select name="controllerType"><option value="arcade">Dual stick (left throttle, right steer)</option><option value="tank">Tank (left / right track)</option></select>
      </label>
      <fieldset><legend>Buttons (topic = tc/&lt;device&gt;/cmd/…)</legend><div id="rpToggleEd"></div>
        <button type="button" class="rp-btn" id="rpAddToggle">+ Add button</button></fieldset>
      <div class="rp-form-actions"><button value="cancel" class="rp-btn">Cancel</button><button value="save" class="rp-btn rp-primary">Save</button></div>
    </form>
  </dialog>
</div>`;
}

let active: { dispose: () => void } | null = null;

export function initializeRoverControlPage(): void {
  active?.dispose();
  const root = document.getElementById('roverPad');
  if (!root) return;
  active = mountRoverPad(root);
}

export function mountRoverPad(root: HTMLElement): { dispose: () => void } {
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  let settings = loadSettings();
  let password = '';
  let transport: RoverTransport = new DemoTransport();
  let session: RoverSession | null = null;
  let disposed = false;
  const toggleState = new Map<string, boolean>();

  document.documentElement.classList.add('rp-active');

  const msg = (t: string) => {
    $('rpMsg').textContent = t;
  };

  const render = (s: SessionSnapshot | null) => {
    const link = s?.link ?? 'disconnected';
    const pill = $('rpLink');
    pill.textContent = s?.estop ? 'E-STOP' : link === 'connected' ? (transport.kind === 'demo' ? 'demo' : 'connected') : link;
    pill.dataset.state = s?.estop ? 'estop' : link;
    $('rpConnect').textContent = link === 'connected' || link === 'connecting' ? 'Disconnect' : 'Connect';
    $('rpDev').textContent = settings.deviceId ? `rover ${settings.deviceId}` : 'no rover set';
    const est = $('rpEstop');
    est.classList.toggle('rp-latched', !!s?.estop);
    est.textContent = s?.estop ? 'E-STOP ON · hold to release' : 'E-STOP';
    $('rpType').textContent = settings.controllerType === 'tank' ? 'Tank' : 'Dual stick';
    $('rpSpeed').textContent = `Speed: ${settings.speedMode}`;
    $('rpLblL').textContent = settings.controllerType === 'tank' ? 'left track' : 'throttle';
    $('rpLblR').textContent = settings.controllerType === 'tank' ? 'right track' : 'steer';
    const p = s?.lastSent;
    $('rpCmd').textContent = p ? `${p.dir} ${Math.round(p.speed * 100)}% #${p.seq}` : 'stop';
    if (s?.needsRecenter && link === 'connected' && !s.estop) msg('Center both sticks to drive');
    else if (link !== 'connected') msg(transport.kind === 'demo' ? '' : 'Not connected: the rover stops on its own when commands stop');
    else msg('');
  };

  const buildSession = () => {
    session?.dispose();
    session = new RoverSession(
      transport,
      settings.deviceId || 'demo',
      undefined,
      { onState: render },
      settings.controllerType,
      settings.speedMode,
    );
    session.start();
    render(session.state);
  };

  const connect = async () => {
    await disconnect();
    if (settings.transport === 'mqtt') {
      if (!settings.deviceId) {
        msg('Set the rover device ID in ⚙︎ first');
        return;
      }
      transport = new MqttWsTransport({ url: normalizeBrokerUrl(settings.brokerUrl), username: settings.username, password });
    } else {
      transport = new DemoTransport();
    }
    buildSession();
    try {
      await transport.connect();
    } catch (e) {
      msg(`Could not connect: ${(e as Error)?.message || String(e)}`);
    }
  };

  const disconnect = async () => {
    session?.dispose();
    session = null;
    try {
      await transport.disconnect();
    } catch {
      /* ignore */
    }
    render(null);
  };

  // ── Sticks ────────────────────────────────────────────────────────────────
  type StickCtl = { el: HTMLElement; knob: HTMLElement; pointer: number | null; v: StickState };
  const mk = (id: string): StickCtl => {
    const el = $(id);
    return { el, knob: el.querySelector('.rp-knob') as HTMLElement, pointer: null, v: { x: 0, y: 0 } };
  };
  const sticks = { left: mk('rpStickL'), right: mk('rpStickR') };

  const axisLock = (side: 'left' | 'right'): 'x' | 'y' | null => {
    if (settings.controllerType === 'tank') return 'y';
    return side === 'left' ? 'y' : 'x';
  };

  const drawKnob = (s: StickCtl) => {
    const r = s.el.clientWidth / 2 - s.knob.clientWidth / 2;
    s.knob.style.transform = `translate(${s.v.x * r}px, ${-s.v.y * r}px)`;
  };

  const setFromPointer = (side: 'left' | 'right', ev: PointerEvent) => {
    const s = sticks[side];
    const rect = s.el.getBoundingClientRect();
    const r = rect.width / 2;
    let x = (ev.clientX - (rect.left + r)) / r;
    let y = -(ev.clientY - (rect.top + r)) / r;
    const lock = axisLock(side);
    if (lock === 'y') x = 0;
    if (lock === 'x') y = 0;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    s.v = { x, y };
    drawKnob(s);
  };

  const releaseStick = (side: 'left' | 'right') => {
    const s = sticks[side];
    s.pointer = null;
    s.v = { x: 0, y: 0 };
    drawKnob(s); // spring back to center
    if (sticks.left.pointer === null && sticks.right.pointer === null && !gamepadActive) session?.release();
  };

  const listeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions?]> = [];
  const on = (t: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, opts);
    listeners.push([t, type, fn, opts]);
  };

  (['left', 'right'] as const).forEach((side) => {
    const s = sticks[side];
    on(s.el, 'pointerdown', ((ev: PointerEvent) => {
      if (s.pointer !== null) return;
      ev.preventDefault();
      s.pointer = ev.pointerId;
      try {
        s.el.setPointerCapture(ev.pointerId);
      } catch {
        /* older WebViews */
      }
      setFromPointer(side, ev);
    }) as EventListener);
    on(s.el, 'pointermove', ((ev: PointerEvent) => {
      if (ev.pointerId !== s.pointer) return;
      ev.preventDefault();
      setFromPointer(side, ev);
    }) as EventListener);
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(s.el, t, ((ev: PointerEvent) => {
        if (ev.pointerId === s.pointer) releaseStick(side);
      }) as EventListener);
    }
  });
  // Stop iOS rubber-banding / page scroll while driving.
  on(root, 'touchmove', ((e: TouchEvent) => e.preventDefault()) as EventListener, { passive: false });

  // ── Gamepad (Bluetooth controllers via the Gamepad API) ──────────────────
  let gamepadActive = false;
  let gpPrev = { estop: false, speedUp: false, speedDown: false };
  const readPad = (): GamepadSample | null => {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads || []) if (p && p.connected) return p;
    return null;
  };
  on(window, 'gamepaddisconnected', (() => {
    gamepadActive = false;
    $('rpGp').hidden = true;
    session?.release(); // deadman: controller lost = stop
  }) as EventListener);
  on(window, 'gamepadconnected', (() => {
    $('rpGp').hidden = false;
  }) as EventListener);

  // ── Main loop (animation frame): feeds the session every frame while input
  // is held, so the session's input timeout catches a frozen/hidden UI.
  let raf = 0;
  let wasDriving = false;
  const frame = () => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const touching = sticks.left.pointer !== null || sticks.right.pointer !== null;
    let left = sticks.left.v;
    let right = sticks.right.v;
    const gp = readPad();
    if (gp) {
      const g = readGamepad(gp);
      if (g.estop && !gpPrev.estop) session?.estop();
      if (g.speedUp && !gpPrev.speedUp) cycleSpeed(1);
      if (g.speedDown && !gpPrev.speedDown) cycleSpeed(-1);
      gpPrev = { estop: g.estop, speedUp: g.speedUp, speedDown: g.speedDown };
      const moving = Math.max(Math.abs(g.left.x), Math.abs(g.left.y), Math.abs(g.right.x), Math.abs(g.right.y)) > 0.12;
      gamepadActive = moving;
      if (!touching && moving) {
        left = g.left;
        right = g.right;
      }
    } else {
      gamepadActive = false;
    }
    const driving = touching || gamepadActive;
    if (driving) session?.setInput(left, right);
    else if (wasDriving) session?.release();
    wasDriving = driving;
  };
  raf = requestAnimationFrame(frame);

  // ── Deadman on app lifecycle ─────────────────────────────────────────────
  const releaseAll = () => {
    releaseStick('left');
    releaseStick('right');
    session?.release();
  };
  on(document, 'visibilitychange', (() => {
    if (document.hidden) releaseAll();
  }) as EventListener);
  on(window, 'blur', releaseAll as EventListener);
  on(window, 'pagehide', releaseAll as EventListener);

  // ── Controls ─────────────────────────────────────────────────────────────
  const speeds = Object.keys(SPEED_MODES) as SpeedMode[];
  const cycleSpeed = (d: number) => {
    const i = speeds.indexOf(settings.speedMode);
    settings.speedMode = speeds[Math.min(speeds.length - 1, Math.max(0, i + d))];
    saveSettings(settings);
    session?.setSpeedMode(settings.speedMode);
    render(session?.state ?? null);
  };
  on($('rpSpeed'), 'click', (() => {
    const i = speeds.indexOf(settings.speedMode);
    settings.speedMode = speeds[(i + 1) % speeds.length];
    saveSettings(settings);
    session?.setSpeedMode(settings.speedMode);
    render(session?.state ?? null);
  }) as EventListener);
  on($('rpType'), 'click', (() => {
    settings.controllerType = settings.controllerType === 'tank' ? 'arcade' : 'tank';
    saveSettings(settings);
    releaseAll();
    session?.setControllerType(settings.controllerType);
    render(session?.state ?? null);
  }) as EventListener);

  // E-stop: one tap latches; releasing needs a 1.5 s hold so it can't be
  // cleared by accident.
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  on($('rpEstop'), 'pointerdown', ((ev: PointerEvent) => {
    ev.preventDefault();
    if (!session) return;
    if (!session.state.estop) {
      releaseAll();
      session.estop();
      return;
    }
    holdTimer = setTimeout(() => {
      session?.clearEstop();
      holdTimer = null;
    }, 1500);
  }) as EventListener);
  for (const t of ['pointerup', 'pointerleave', 'pointercancel']) {
    on($('rpEstop'), t, (() => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
    }) as EventListener);
  }

  const renderToggles = () => {
    const box = $('rpToggles');
    box.innerHTML = settings.toggles
      .filter((t) => t.enabled)
      .map(
        (t) =>
          `<button class="rp-btn rp-toggle" data-id="${esc(t.id)}" aria-pressed="${toggleState.get(t.id) ? 'true' : 'false'}">${esc(t.label)}</button>`,
      )
      .join('');
    box.querySelectorAll<HTMLButtonElement>('.rp-toggle').forEach((b) => {
      const def = settings.toggles.find((t) => t.id === b.dataset.id)!;
      const send = (val: boolean) => {
        toggleState.set(def.id, val);
        b.setAttribute('aria-pressed', val ? 'true' : 'false');
        if (def.topic && session && !session.state.estop) {
          if (!session.publishAux(def.topic, { [def.key]: val })) msg('Not connected');
        }
      };
      if (def.momentary) {
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          send(true);
        });
        for (const t of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(t, () => toggleState.get(def.id) && send(false));
      } else {
        b.addEventListener('click', () => send(!toggleState.get(def.id)));
      }
    });
  };

  // ── Settings dialog ──────────────────────────────────────────────────────
  const dlg = $<HTMLDialogElement>('rpDialog');
  const form = $<HTMLFormElement>('rpForm');
  const toggleRow = (t: ToggleDef) =>
    `<div class="rp-trow"><input name="tLabel" value="${esc(t.label)}" aria-label="Label" maxlength="16">` +
    `<input name="tTopic" value="${esc(t.topic)}" aria-label="Topic" placeholder="topic">` +
    `<label><input type="checkbox" name="tMom" ${t.momentary ? 'checked' : ''}> hold</label>` +
    `<label><input type="checkbox" name="tOn" ${t.enabled ? 'checked' : ''}> show</label>` +
    `<input type="hidden" name="tId" value="${esc(t.id)}"><input type="hidden" name="tKey" value="${esc(t.key)}"></div>`;
  const openSettings = () => {
    releaseAll();
    (form.elements.namedItem('transport') as HTMLSelectElement).value = settings.transport;
    (form.elements.namedItem('brokerUrl') as HTMLInputElement).value = settings.brokerUrl;
    (form.elements.namedItem('username') as HTMLInputElement).value = settings.username;
    (form.elements.namedItem('password') as HTMLInputElement).value = password;
    (form.elements.namedItem('deviceId') as HTMLInputElement).value = settings.deviceId;
    (form.elements.namedItem('controllerType') as HTMLSelectElement).value = settings.controllerType;
    $('rpToggleEd').innerHTML = settings.toggles.map(toggleRow).join('');
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  };
  on($('rpAddToggle'), 'click', (() => {
    const n = $('rpToggleEd').querySelectorAll('.rp-trow').length;
    if (n >= 8) return;
    $('rpToggleEd').insertAdjacentHTML('beforeend', toggleRow({ id: `custom${Date.now().toString(36)}`, label: 'Button', topic: '', key: 'on', enabled: true }));
  }) as EventListener);
  on(dlg, 'close', (() => {
    if (dlg.returnValue !== 'save') return;
    const f = new FormData(form);
    const rows = Array.from($('rpToggleEd').querySelectorAll('.rp-trow')).map((row) => {
      const q = (n: string) => row.querySelector<HTMLInputElement>(`[name="${n}"]`)!;
      return { id: q('tId').value, label: q('tLabel').value, topic: q('tTopic').value, key: q('tKey').value, momentary: q('tMom').checked, enabled: q('tOn').checked };
    });
    settings = {
      ...settings,
      transport: f.get('transport') === 'mqtt' ? 'mqtt' : 'demo',
      brokerUrl: String(f.get('brokerUrl') || ''),
      username: String(f.get('username') || ''),
      deviceId: String(f.get('deviceId') || '').trim(),
      controllerType: f.get('controllerType') === 'tank' ? 'tank' : 'arcade',
      toggles: sanitizeToggles(rows),
    };
    password = String(f.get('password') || ''); // kept in memory only, never stored
    saveSettings(settings);
    renderToggles();
    void connect();
  }) as EventListener);
  on($('rpSettings'), 'click', openSettings as EventListener);
  on($('rpConnect'), 'click', (() => {
    if (transport.isConnected()) void disconnect();
    else void connect();
  }) as EventListener);
  on($('rpExit'), 'click', (() => {
    window.location.hash = '';
  }) as EventListener);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    releaseAll();
    session?.dispose();
    session = null;
    void transport.disconnect();
    listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
    window.removeEventListener('hashchange', onHash);
    document.documentElement.classList.remove('rp-active');
    if (active?.dispose === dispose) active = null;
  };
  const onHash = () => {
    if (window.location.hash.slice(1) !== 'rover-control') dispose();
  };
  window.addEventListener('hashchange', onHash);

  renderToggles();
  render(null);
  // Demo mode connects straight away so the pad is usable without a rover.
  if (settings.transport === 'demo') void connect();
  else msg('Tap Connect to reach the rover');
  return { dispose };
}

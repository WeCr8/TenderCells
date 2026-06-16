// useGamepad.ts
// Optional USB / Bluetooth game controller support for robot control.
//
// OFF by default — only polls when the user explicitly enables controller support
// (privacy + no surprise motion). Uses the standard browser Gamepad API (Chrome/Edge),
// the same browsers the flasher needs, so no extra install.
//
// Typical mapping (done by the consumer via onFrame):
//   left stick  → gantry X/Y jog
//   right stick → arm joint nudge
//   A/X button  → home, Start → E-STOP
// The hook just surfaces a debounced snapshot; the control panel maps it to commands.

import { useEffect, useRef, useState } from 'react';

export interface GamepadFrame {
  axes: number[];       // -1..1 per axis (sticks/triggers)
  buttons: boolean[];   // pressed state per button
  pressed: number[];    // indices that went down THIS frame (edge), for one-shot actions
}

interface GamepadStatus {
  supported: boolean;   // browser exposes the Gamepad API
  connected: boolean;   // a pad is attached
  id: string | null;    // controller name
}

const DEADZONE = 0.15;  // ignore tiny stick drift

/**
 * @param enabled  Only poll/emit when true (user opted in).
 * @param onFrame  Called ~per animation frame with the current controller snapshot.
 */
export function useGamepad(enabled: boolean, onFrame?: (f: GamepadFrame) => void): GamepadStatus {
  const [status, setStatus] = useState<GamepadStatus>({
    supported: typeof navigator !== 'undefined' && 'getGamepads' in navigator,
    connected: false,
    id: null,
  });
  const rafRef = useRef<number | null>(null);
  const prevButtons = useRef<boolean[]>([]);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled || !status.supported) return;

    const onConnect = (e: GamepadEvent) =>
      setStatus((s) => ({ ...s, connected: true, id: e.gamepad.id }));
    const onDisconnect = () => setStatus((s) => ({ ...s, connected: false, id: null }));
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    const loop = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = Array.from(pads).find((p) => p);  // first connected pad
      if (pad) {
        const axes = pad.axes.map((a) => (Math.abs(a) < DEADZONE ? 0 : a));
        const buttons = pad.buttons.map((b) => b.pressed);
        const pressed: number[] = [];
        buttons.forEach((b, i) => {
          if (b && !prevButtons.current[i]) pressed.push(i);  // rising edge
        });
        prevButtons.current = buttons;
        onFrameRef.current?.({ axes, buttons, pressed });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      prevButtons.current = [];
    };
  }, [enabled, status.supported]);

  return status;
}

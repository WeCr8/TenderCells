export function keyboardToArcadeRaw(state, now = Date.now()) {
    const throttle = (state.forward ? 1 : 0) + (state.back ? -1 : 0);
    const steering = (state.right ? 1 : 0) + (state.left ? -1 : 0);
    return {
        source: 'keyboard',
        axes: { throttle, steering },
        active: throttle !== 0 || steering !== 0,
        timestampMs: now,
    };
}

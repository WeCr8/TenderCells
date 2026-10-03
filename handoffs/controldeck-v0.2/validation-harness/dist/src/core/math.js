export function clampUnit(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(-1, Math.min(1, value));
}
export function applyDeadzone(value, deadzone) {
    const v = clampUnit(value);
    const dz = Math.max(0, Math.min(0.95, deadzone));
    if (Math.abs(v) <= dz)
        return 0;
    return Math.sign(v) * ((Math.abs(v) - dz) / (1 - dz));
}
export function applyExpo(value, expo) {
    const v = clampUnit(value);
    const e = Math.max(0, Math.min(1, expo));
    return clampUnit((1 - e) * v + e * v * v * v);
}
export function shapeAxis(value, deadzone, expo, speedLimit) {
    const shaped = applyExpo(applyDeadzone(value, deadzone), expo);
    const limit = Math.max(0, Math.min(1, speedLimit));
    return clampUnit(shaped * limit);
}

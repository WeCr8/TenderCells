import { clampUnit, applyDeadzone, shapeAxis } from './core/math.js';
import { differentialMix, mecanumMix } from './core/mixers.js';
import { ControlEngine } from './core/ControlEngine.js';
import { profileIsAllowed } from './core/CapabilityGate.js';
import { CONTROL_PROFILES } from './profiles/registry.js';
import { floatingStickAxes } from './inputs/pointerMath.js';
import { RoverSimulator } from './sim/RoverSimulator.js';
import { validateControlFrame } from './backend/controlSchema.js';
import { ControlSessionManager } from './backend/controlSessions.js';
let passed = 0;
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e)
        throw new Error(`${name}: expected ${e}, got ${a}`);
    passed++;
}
function ok(name, condition) {
    if (!condition)
        throw new Error(`${name}: condition failed`);
    passed++;
}
eq('clamp high', clampUnit(2), 1);
eq('clamp NaN', clampUnit(Number.NaN), 0);
eq('deadzone center', applyDeadzone(0.05, 0.1), 0);
ok('speed cap', Math.abs(shapeAxis(1, 0, 0, 0.35) - 0.35) < 1e-9);
eq('differential straight', differentialMix(1, 0), { left: 1, right: 1 });
ok('mecanum normalized', Object.values(mecanumMix(1, 1, 1)).every(v => Math.abs(v) <= 1));
const p = CONTROL_PROFILES.freetouch;
const engine = new ControlEngine('session-12345678', 'rover_1', p);
const f1 = engine.next({ source: 'touch', axes: { throttle: 1, steering: 0 }, active: true, timestampMs: 1 }, 1000);
eq('first seq', f1.seq, 1);
eq('neutral deadman', engine.neutral(1001).deadman, false);
ok('profile allow', profileIsAllowed(p, { motion: true, kinematics: 'differential', allowedProfiles: ['freetouch'] }));
ok('profile reject', !profileIsAllowed(p, { motion: true, kinematics: 'differential', allowedProfiles: ['arcade'] }));
eq('pointer center', floatingStickAxes({ x: 1, y: 1 }, { x: 1, y: 1 }, 50), { x: 0, y: 0 });
eq('pointer up', floatingStickAxes({ x: 0, y: 50 }, { x: 0, y: 0 }, 50).y, 1);
const sim = new RoverSimulator();
sim.step(f1, 0.1);
ok('sim moved', sim.pose.x !== 0 || sim.pose.y !== 0);
const frame = {
    v: 1, sessionId: 'session-12345678', deviceId: 'rover_1', profileId: 'freetouch',
    seq: 1, sentAtMs: 1000, deadman: true, axes: { throttle: 0.5 }
};
eq('schema valid', validateControlFrame(frame, 1000), null);
ok('schema axis rejects', !!validateControlFrame({ ...frame, axes: { throttle: 2 } }, 1000));
const stops = [];
const sm = new ControlSessionManager(500, (id) => stops.push(id));
sm.open(frame.sessionId, frame.deviceId, frame.profileId, 1000);
ok('accept first', sm.accept(frame, 1000).ok);
ok('reject duplicate', !sm.accept(frame, 1001).ok);
eq('sweep expired', sm.sweep(1600), ['rover_1']);
eq('neutralized', stops, ['rover_1']);
console.log(`PASS ${passed} Control Deck core/regression assertions`);

import fs from 'node:fs';
import path from 'node:path';

const packageRoot = path.resolve(process.cwd().includes('validation-harness') ? '..' : '.');
const overlay = path.join(packageRoot, 'repo-overlay');

function read(rel) {
  return fs.readFileSync(path.join(overlay, rel), 'utf8');
}
function must(cond, message) {
  if (!cond) throw new Error('REGRESSION: ' + message);
}

const gateway = read('applications/tendercells_ui/test_output/express-api/backend/src/control/controlGateway.ts');
const adapter = read('applications/tendercells_ui/test_output/express-api/backend/src/control/controlAdapters.ts');
const deck = read('applications/tendercells_ui/test_output/tendercells-ui/src/control/components/ControlDeck.tsx');
const freeTouch = read('applications/tendercells_ui/test_output/tendercells-ui/src/control/components/FreeTouchSurface.tsx');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot,'manifest.json'),'utf8'));

must(manifest.baseline_sha === '53c934786be821084dec43fb5194f72ae2d7af73', 'unexpected repo baseline');
must(!/firebase/i.test(gateway), 'continuous control gateway must not route through Firebase');
must(adapter.includes('/cmd/drive/analog'), 'analog motion MQTT topic is missing');
must(adapter.includes("deadman: false"), 'neutral payload must clear deadman');
must(gateway.includes('staleMs ?? 500'), 'server stale-frame watchdog default changed unexpectedly');
must(gateway.includes("manager.close"), 'socket close must release lease and neutralize');
must(deck.includes('onEmergencyStop'), 'Control Deck must expose dedicated E-STOP action');
must(freeTouch.includes('onPointerCancel'), 'pointer cancel must neutralize touch input');
must(freeTouch.includes('onLostPointerCapture'), 'lost pointer capture must be handled');
must(!/tc_mesh.*video|video.*tc_mesh/i.test(gateway + adapter), 'LoRa/video coupling found in controller core');

console.log('PASS Control Deck package regression invariants');

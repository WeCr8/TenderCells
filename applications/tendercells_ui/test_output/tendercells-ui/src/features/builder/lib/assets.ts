// assets.ts - stable image asset IDs used by Builder steps (docs/builder/README.md#images).
// Until reference-checked art exists under public/builder-assets/, each ID has an
// illustrated fallback (icon + name). Technical parts (boards, components) are marked so the UI
// never presents a placeholder as an authoritative pinout.
export interface AssetEntry { label: string; icon: string; technical?: boolean; file?: string }

export const ASSETS: Record<string, AssetEntry> = {
  'scene.demo-farm.overview': { label: 'Demo farm', icon: '🗺️' },
  'system.chicken-tender.iso': { label: 'Chicken Tender', icon: '🐔' },
  'system.watchtower.iso': { label: 'WatchTower', icon: '📡' },
  'robot.roaming-roost.iso': { label: 'Roaming Roost', icon: '🛖' },
  'robot.mower.generic.iso': { label: 'Robot mower', icon: '🚜' },
  'animal.chicken.generic': { label: 'Chicken', icon: '🐓' },
  'sensor.temperature.generic': { label: 'Temperature sensor', icon: '🌡️' },
  'ui.event.predator': { label: 'Predator event', icon: '🦊' },
  'ui.state.heat-high': { label: 'Too hot', icon: '🔥' },
  'ui.zone.mower-work-area': { label: "Mower's work area", icon: '🟩' },
  'ui.rule.when-if-do': { label: 'WHEN · IF · DO', icon: '🧠' },
  'breadboard.halfsize.generic': { label: 'Half-size breadboard', icon: '🔲', technical: true },
  'board.seeed.xiao-esp32s3.rev1': { label: 'Seeed XIAO ESP32-S3', icon: '🟦', technical: true },
  'component.led.5mm.red.generic': { label: '5 mm red LED', icon: '🔴', technical: true },
  'component.resistor.220ohm.axial': { label: '220 Ω resistor', icon: '〰️', technical: true },
  'cable.usbc.data.generic': { label: 'USB-C data cable', icon: '🔌', technical: true },
};

export const assetFor = (id?: string): AssetEntry | undefined => (id ? ASSETS[id] : undefined);

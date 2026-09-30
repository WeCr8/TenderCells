// usdExport.ts - property layout -> OpenUSD text (.usda) for NVIDIA Isaac Sim / Omniverse.
// Isaac Sim's default stage is Z-up in metres, so: USD X = east, USD Y = north, Z = up.
// Ground is a height-field mesh from terrain heightAt(); each product / obstacle is a box
// prim (swap in the real robot USD by referencing it onto /World/Property/<id>); every
// camera mount becomes a Camera prim so Replicator can render the same views as the OS.
// Usage: PropertyLayoutBuilder "Isaac Sim (.usda)" button; firmware/jetson-nano/isaac/.
import type { PropertyItem, PropertyLayoutState } from '../../components/property/propertyLayoutStore';
import { heightAt } from '../../components/property/terrain';
import { mountsFor } from './cameraMounts';

export const M_PER_FT = 0.3048;

/** Approximate item heights (ft) for the box stand-ins. */
const HEIGHT_FT: Record<string, number> = {
  'chicken-tender': 5, 'roaming-roost': 4, 'duck-dock': 6, 'goat-guardian': 8, 'bunny-burrow': 5,
  'turkey-tower': 6, 'pigeon-palace': 6, watchtower: 5, 'rail-module': 1, sensor: 1,
  'farmbot-genesis': 2.5, 'farmbot-genesis-xl': 2.5, aquaponics: 3, hydroponics: 5, greenhouse: 8,
  tree: 15, bush: 3, 'crop-row': 1.5, fence: 4, pond: 0.1, rock: 1.5, building: 10, garden: 0.5, 'no-go-zone': 0.05,
};

const COLORS: Record<string, [number, number, number]> = {
  hardware: [0.29, 0.49, 0.35], tree: [0.2, 0.4, 0.15], pond: [0.2, 0.4, 0.7], building: [0.6, 0.55, 0.5], other: [0.5, 0.45, 0.35],
};

/** Valid USD prim name from any id. */
export const primName = (id: string) => {
  const s = id.replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(s) ? s : `_${s}`;
};

const f = (n: number) => Number(n.toFixed(4)).toString();
const str = (s: string) => JSON.stringify(s);

/** Property feet (x right, y down from the top-left) -> USD metres centred on the property. */
export function toUsd(xFt: number, yFt: number, zFt: number, widthFt: number, depthFt: number): [number, number, number] {
  return [(xFt - widthFt / 2) * M_PER_FT, (depthFt / 2 - yFt) * M_PER_FT, zFt * M_PER_FT];
}

function groundMesh(layout: PropertyLayoutState, stepFt: number): string {
  const { widthFt: W, depthFt: D } = layout.property;
  const nx = Math.max(1, Math.round(W / stepFt)), ny = Math.max(1, Math.round(D / stepFt));
  const pts: string[] = [];
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = (i / nx) * W, y = (j / ny) * D;
      pts.push(`(${toUsd(x, y, heightAt(layout.property, x, y), W, D).map(f).join(', ')})`);
    }
  }
  const counts: number[] = [], idx: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      counts.push(4);
      idx.push(a, a + nx + 1, a + nx + 2, a + 1); // counter-clockwise seen from +Z
    }
  }
  return `    def Mesh "Ground" (
        prepend apiSchemas = ["PhysicsCollisionAPI", "PhysicsMeshCollisionAPI"]
    )
    {
        int[] faceVertexCounts = [${counts.join(', ')}]
        int[] faceVertexIndices = [${idx.join(', ')}]
        point3f[] points = [${pts.join(', ')}]
        uniform token subdivisionScheme = "none"
        uniform token physics:approximation = "none"
        color3f[] primvars:displayColor = [(0.33, 0.5, 0.25)]
    }
`;
}

function itemPrim(it: PropertyItem, layout: PropertyLayoutState): string {
  const { widthFt: W, depthFt: D } = layout.property;
  const cx = it.x + it.width / 2, cy = it.y + it.depth / 2;
  const base = heightAt(layout.property, cx, cy);
  const h = HEIGHT_FT[it.type] ?? 3;
  const [x, y, z] = toUsd(cx, cy, base + h / 2, W, D);
  const color = COLORS[it.kind === 'hardware' ? 'hardware' : it.type] ?? COLORS.other;
  const cams = it.kind === 'hardware' ? mountsFor(it) : [];
  const camPrims = cams.map((m) => {
    // Camera looks down its local -Z with +Y up. Rotate: pitch up to horizontal (90° about X),
    // then yaw (clockwise from north = negative about Z), then the tilt.
    const [px, py, pz] = [m.fx * it.width * M_PER_FT, -m.fz * it.depth * M_PER_FT, (m.heightFt - h / 2) * M_PER_FT];
    const horizAperture = 20.955;
    const focal = horizAperture / (2 * Math.tan((m.hfovDeg * Math.PI) / 360));
    return `
        def Camera "cam_${primName(m.id)}" (
            doc = ${str(m.label)}
        )
        {
            float focalLength = ${f(focal)}
            float horizontalAperture = ${horizAperture}
            float verticalAperture = ${f(horizAperture * 0.75)}
            float2 clippingRange = (0.05, 500)
            custom bool tc:inside = ${m.inside ? 1 : 0}
            custom string tc:streamDeviceId = ${str(m.streamDeviceId ?? `${it.deviceId ?? it.id}_${m.id}`)}
            double3 xformOp:translate = (${f(px)}, ${f(py)}, ${f(pz)})
            float3 xformOp:rotateXYZ = (${f(90 + m.pitchDeg)}, 0, ${f(-m.yawDeg)})
            uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:rotateXYZ"]
        }`;
  }).join('');
  return `
    def Xform "${primName(it.id)}" (
        doc = ${str(it.name)}
    )
    {
        custom string tc:kind = ${str(it.kind)}
        custom string tc:type = ${str(it.type)}
        custom string tc:deviceId = ${str(it.deviceId ?? '')}
        double3 xformOp:translate = (${f(x)}, ${f(y)}, ${f(z)})
        uniform token[] xformOpOrder = ["xformOp:translate"]

        def Cube "Body" (
            prepend apiSchemas = ["PhysicsCollisionAPI"]
        )
        {
            double size = 1
            float3 xformOp:scale = (${f(it.width * M_PER_FT)}, ${f(it.depth * M_PER_FT)}, ${f(h * M_PER_FT)})
            uniform token[] xformOpOrder = ["xformOp:scale"]
            color3f[] primvars:displayColor = [(${color.join(', ')})]
        }${camPrims}
    }
`;
}

/**
 * Build a .usda stage for the property: terrain ground, items, cameras, sun + physics.
 *
 * @param layout - Property layout (as saved by the layout builder)
 * @param stepFt - Ground mesh spacing in feet (smaller = finer terrain, bigger file)
 * @returns USDA text; open it in Isaac Sim (File > Open) or reference it into a scene
 */
export function layoutToUsda(layout: PropertyLayoutState, stepFt = 2): string {
  const p = layout.property;
  return `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    upAxis = "Z"
    doc = ${str(`Tender Cells property "${p.name}" ${p.widthFt}x${p.depthFt} ft - exported from Tender Cells OS`)}
)

def Xform "World"
{
    def PhysicsScene "PhysicsScene"
    {
        vector3f physics:gravityDirection = (0, 0, -1)
        float physics:gravityMagnitude = 9.81
    }

    def DistantLight "Sun"
    {
        float inputs:intensity = 3000
        float3 xformOp:rotateXYZ = (45, 0, 30)
        uniform token[] xformOpOrder = ["xformOp:rotateXYZ"]
    }

    def Xform "Property" (
        doc = ${str(p.name)}
    )
    {
        custom double tc:widthFt = ${p.widthFt}
        custom double tc:depthFt = ${p.depthFt}
${groundMesh(layout, stepFt)}${layout.items.map((it) => itemPrim(it, layout)).join('')}    }
}
`;
}

/** Trigger a browser download of the stage. */
export function downloadUsda(layout: PropertyLayoutState): void {
  const blob = new Blob([layoutToUsda(layout)], { type: 'model/vnd.usda' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(layout.property.name || 'property').replace(/[^\w-]+/g, '_')}.usda`;
  document.body.appendChild(a); // attached: Firefox ignores clicks on detached links
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

# CAD to Web: SolidWorks → GLB Pipeline

> Guide for exporting Tender Cells CAD models (.sldprt / .sldasm) to web-ready GLB format

---

## File Locations

**Preset models go here:**
```
public/models/coops/presets/
├── coop-3x3x5.glb          (2-5 MB)
├── coop-4x4x6.glb          (5-10 MB)
└── coop-6x6x8.glb          (10-15 MB)
```

**Custom models uploaded via app:**
```
Firebase Storage: gs://storage/models/coops/custom/{userId}/{deviceId}/
```

---

## Export Workflow: SolidWorks → GLB

### Step 1: Prepare Model in SolidWorks

1. Open .sldprt or .sldasm file
2. Hide parts not needed for visualization (internal mechanisms, hidden bolts)
3. Set materials/colors on visible surfaces
4. Verify assembly has no missing references

### Step 2: Export to Collada (.dae)

SolidWorks doesn't export directly to GLB, so use Collada as intermediate:

1. **File → Export → Choose Format**
2. **Select: COLLADA (*.dae)**
3. **Options:**
   - ☑ Export all bodies
   - ☑ Materials
   - ☑ Textures
   - ☑ Coordinate system

### Step 3: Optimize with Blender

1. **Open Blender**
2. **File → Open** → select exported .dae
3. **Review:**
   - Check normals (look correct?)
   - Verify colors/textures imported
   - Scale check (should be to-scale in feet)

4. **Optimize for web:**
   - **Select all objects** (A key)
   - **Decimate modifier** (if needed):
     - Ratio: 0.7–0.9 (removes ~10-30% polys, minimal visual impact)
     - Right-click → Apply modifier
   
   - **Merge objects** (if assembly):
     - Select all → Ctrl+J
   
   - **Bake materials** (if needed):
     - Simplifies textures to reduce file size

5. **Export to GLB:**
   - **File → Export As → glTF 2.0 (.glb/.gltf)**
   - **Format: glTF Binary (.glb)**
   - **Options:**
     - ☑ Format: Binary (.glb)
     - ☑ Include Materials
     - ☑ Include Textures
     - Compression: ON (if >5MB file)

### Step 4: Place in Web App

```bash
# Copy optimized GLB to presets directory
cp ~/Downloads/coop-4x4x6.glb \
   applications/tendercells_ui/test_output/tendercells-ui/public/models/coops/presets/

# Verify file size is reasonable (<15MB)
ls -lh public/models/coops/presets/coop-*.glb
```

### Step 5: Test in App

1. **Start dev server:**
   ```bash
   cd applications/tendercells_ui/test_output/tendercells-ui
   npm run dev
   ```

2. **Navigate to Chicken Tender Dashboard**

3. **Open model selector button** (3D viewport bottom-right)

4. **Verify model loads and renders** correctly

---

## File Size Targets

| Model | Max Size | SolidWorks → DAE | Blender Optimized → GLB |
|-------|----------|-----------------|------------------------|
| 3x3x5 | 5 MB | 15-20 MB | 2-5 MB |
| 4x4x6 | 10 MB | 30-40 MB | 5-10 MB |
| 6x6x8 | 15 MB | 50-70 MB | 10-15 MB |

**Optimization techniques if file is too large:**
- Increase decimate ratio (0.5–0.7) — remove more polys
- Remove internal details (only keep exterior)
- Remove textures, use vertex colors only
- Use DRACO compression in Blender export settings

---

## Web Integration

Once GLB files are in `public/models/coops/presets/`:

1. **ModelLoader.ts** will find them at:
   ```
   /models/coops/presets/coop-{size}.glb
   ```

2. **Viewport3D** renders automatically when model URL found

3. **useCoopModel hook** manages selection + localStorage

---

## CAD → App Workflow Checklist

```
SolidWorks CAD:
  ☐ Model complete (.sldprt or .sldasm)
  ☐ Simplified (hide internals)
  ☐ Materials/colors assigned
  ☐ No missing references

Export to Collada:
  ☐ File → Export → COLLADA (.dae)
  ☐ All materials + textures exported
  
Blender Optimization:
  ☐ Open .dae, verify import
  ☐ Apply decimate modifier (if large)
  ☐ Merge objects (if assembly)
  ☐ Bake textures (optional)
  ☐ Export as GLB binary
  
Web Integration:
  ☐ Copy .glb to public/models/coops/presets/
  ☐ File size <15 MB
  ☐ Test in dev server (:5173)
  ☐ Verify model renders in Viewport3D
  ☐ Check device detail page shows model
```

---

## Troubleshooting

**Model doesn't load:**
- Check file path: `public/models/coops/presets/coop-{SIZE}.glb`
- Check file size: browser console may reject >50MB files
- Check format: must be binary GLB, not text GLTF

**Model renders upside-down or sideways:**
- In Blender: Rotate 90° around X or Z axis before export
- Check SolidWorks coordinate system during export

**Textures missing:**
- Ensure "Include Textures" checked in Blender GLB export
- Verify textures were in original SolidWorks materials
- Simplify to vertex colors if texture paths are complex

**File is too large:**
- Apply higher decimate ratio (0.5–0.7)
- Remove interior geometry
- Remove textures, use colors only
- Check DRACO compression enabled

---

## Next: Integrate WatchTower AI

Once Chicken Tender presets working:

1. Export WatchTower AI CAD (dome assembly)
2. Create `watchtower-dome.glb`
3. Place in `public/models/watchtower/`
4. Update `WatchTowerMonitor` component to render 3D instead of SVG
5. Test predator monitor page

---

## References

- Three.js GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Blender glTF export: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- DRACO compression: https://github.com/google/draco

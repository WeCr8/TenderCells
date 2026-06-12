# ADR-002: 3D Model Loading Architecture

**Date:** 2026-06-12  
**Status:** Accepted  
**Authors:** Claude Code + WeCr8 Solutions

---

## Context

Tender Cells displays multiple physical products (Chicken Tender, Roaming Roost, WatchTower AI, etc.) in 3D viewports. Each product needs:
- Preset model files (GLB/GLTF format)
- Custom model uploads from users
- Real-time rendering with Three.js
- Texture/material support
- Reasonable file size (<50MB per model)

We needed a system that supports both cloud-hosted presets and user-uploaded custom models while maintaining performance.

## Decision

Adopt a **hybrid model architecture**:

1. **Preset Models** (CDN / public/models)
   - Pre-optimized GLB files checked into repo or CDN
   - Served from `public/models/coops/presets/`
   - Sizes: 3x3x5 (2-5MB), 4x4x6 (5-10MB), 6x6x8 (10-15MB)
   - DRACO compression for file size reduction

2. **Custom Models** (Firebase Storage)
   - User-uploaded GLB/GLTF files
   - Stored in `gs://storage/models/coops/custom/{userId}/{deviceId}/`
   - Max file size: 50MB
   - Metadata tracked (uploader, timestamp, device association)

3. **Loading Pipeline**
   - `ModelLoader.ts`: Three.js wrapper with DRACO support
   - `useCoopModel()` hook: state management + localStorage persistence
   - `CoopModelSelector`: UI component for selection/upload
   - `Viewport3D`: renders loaded model or falls back to procedural geometry

4. **Fallback Strategy**
   - If model fails to load: render procedural box + texture
   - If preset missing: render simplified mesh
   - User can re-upload or select different preset

## Rationale

**Why DRACO compression?**
- Reduces 4x4x6 coop model from ~20MB to ~5MB
- Decompression is fast on modern browsers
- Standard three.js support via GLTFLoader + DRACOLoader

**Why Firebase Storage for custom models?**
- Integrates with existing auth system
- Automatic replication + backup
- Per-user quota management
- Direct URL generation for client-side loading

**Why GLB/GLTF format?**
- Industry standard for 3D web
- Supported by Blender, FreeCAD, Fusion 360
- Binary GLB is more performant than text GLTF
- Single-file distribution (no external textures)

**Why localStorage for last-selected model?**
- Users expect to see their choice on next session
- Avoids re-downloading large files
- No Firebase read quota consumed

## Consequences

**Positive:**
- Supports both preset and custom models seamlessly
- User customization without backend complexity
- Fast loading with DRACO compression
- Clear fallback path if model unavailable

**Challenges:**
- CAD files must be exported to GLB (manual step in asset pipeline)
- File size constraints require optimization in 3D modeling
- Browser compatibility for DRACO (all modern browsers, IE unsupported)
- Firebase quota management needed for high-volume uploads

## Implementation Status

**Complete:**
- ✅ ModelLoader.ts (Three.js wrapper with DRACO)
- ✅ useCoopModel hook (state + localStorage)
- ✅ CoopModelSelector component
- ✅ Viewport3D integration
- ✅ modelUploadService (Firebase Storage)
- ✅ Model types (CoopModelConfig interface)

**Pending:**
- ⏳ Preset GLB files (waiting on CAD export from SolidWorks)
- ⏳ Unit tests for model loading
- ⏳ Performance optimization (LOD system for large models)

## Alternative Approaches Considered

1. **Threejs Editor JSON**
   - Rejected: proprietary format, harder to export from CAD
   - GLTF is more portable

2. **Babylon.js**
   - Rejected: Three.js already integrated, ecosystem larger
   - Switching would duplicate work

3. **WebGL Canvas + custom renderer**
   - Rejected: Three.js is mature, fewer edge cases
   - Don't reinvent rendering

## Next Steps

1. Export .sldprt models to GLB format (user to complete CAD → .glb workflow)
2. Place preset GLB files in `public/models/coops/presets/`
3. Add Firebase Storage quota monitoring
4. Implement LOD (Level of Detail) system for very large custom models
5. Add model validation API (validate uploaded GLB before saving)

---

## Related Decisions

- [[001-mqtt-not-firebase-for-motion]]: Motion commands stay local (MQTT), not via Firebase
- Future: CAD asset pipeline (export automation from SolidWorks → GLB)

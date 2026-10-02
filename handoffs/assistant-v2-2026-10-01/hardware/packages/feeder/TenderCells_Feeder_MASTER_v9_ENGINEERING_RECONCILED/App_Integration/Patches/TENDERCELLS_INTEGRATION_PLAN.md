# Suggested TenderCells Patch

The current codebase already has the correct building blocks: `Viewport3D`, `GLTFLoader`, `useCoopModel`, Firebase storage, and `modelUploadService`.

Recommended minimal patch:

1. Add the four `App_Integration/Web/*.tsx` files under `src/components/viewport/feeder/`.
2. Add a `SmartFeederViewerPage.tsx` that receives the selected device/model URL and telemetry.
3. Add one React Router route for the page or render `FeederViewerPanel` inside the Chicken Tender device view.
4. Upload `TenderCells_Smart_Feeder_Interactive_v4.glb` through the existing GLB uploader.
5. Store the returned URL on the feeder/device record using the same model URL pattern already used for custom coop models.
6. Map local feeder state to the telemetry schema.

### Do not replace `Viewport3D`
This viewer is a product-level digital twin. `Viewport3D` should remain the property/layout viewport. They can coexist: property view shows where the feeder is; feeder view shows how the feeder itself is functioning.

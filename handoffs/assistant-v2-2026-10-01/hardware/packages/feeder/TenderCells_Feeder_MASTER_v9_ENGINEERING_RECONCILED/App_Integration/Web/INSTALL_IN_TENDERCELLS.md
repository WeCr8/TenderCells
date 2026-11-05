# Existing TenderCells Web Integration

## 1. Copy files
Copy `FeederFunctionalViewer.tsx`, `FeederViewerPanel.tsx`, `FeederModelUploadCard.tsx`, and `useFeederTelemetryBridge.ts` into the existing viewport/components area.

## 2. Put the GLB somewhere uploadable
Use `Assets/TenderCells_Smart_Feeder_Interactive_v4.glb`. The current TenderCells upload service accepts GLB only and enforces a 50 MB limit. This packaged model is intentionally below that limit.

## 3. Upload with the current service
The supplied `FeederModelUploadCard` calls the existing `modelUploadService.uploadModel(file,userId,deviceId)` and returns the Firebase download URL.

## 4. Render
```tsx
<FeederViewerPanel modelUrl={uploadedUrl} />
```

Or wire live telemetry:
```tsx
<FeederFunctionalViewer
  modelUrl={uploadedUrl}
  telemetry={feederTelemetry}
  visualOnly
/>
```

## 5. Recommended route
Add a route such as `/app/products/smart-feeder/viewer` or embed the panel inside the Chicken Tender device detail page.

## 6. Live data
Map the feeder's local/MQTT telemetry into the `FeederTelemetry` type. For cloud dashboards, mirror state only. Keep commands local unless a secure local gateway intentionally proxies them with all safety interlocks.

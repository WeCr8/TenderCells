# React Native Drop-In

The native component intentionally uses `react-native-webview` to reuse the exact TenderCells Three.js renderer instead of maintaining a second native 3D engine.

1. Add `react-native-webview` to the mobile application.
2. Host the web viewer route inside the TenderCells web app.
3. Provide that route as `viewerUrl` and the Firebase GLB URL as `modelUrl`.
4. Pass telemetry into the component. Each telemetry update is injected into the hosted viewer as a `tendercells:feeder-telemetry` event.

```tsx
<TenderCellsFeederViewerNative
  viewerUrl="https://tendercells.com/app/products/smart-feeder/viewer"
  modelUrl={feeder.modelUrl}
  telemetry={feeder.telemetry}
/>
```

This keeps model rendering behavior consistent across Android, iOS and the current browser application.

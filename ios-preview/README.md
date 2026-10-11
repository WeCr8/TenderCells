# TenderCells iOS preview

This Expo project is a local iPhone/iPad preview of the public TenderCells farm demo at `https://tendercells.com/app/demo`. It opens the existing demo in a WebView; it is separate from the unfinished native device-control prototype under `../app/`, and it is not a signed App Store build.

On the Mac mini, the Xcode workspace is `~/Projects/tendercells-ios-20261011/ios/TenderCells.xcworkspace`. A shortcut is in `~/Desktop/iOS-App-Projects/`. Xcode 27 and the iPhone 18 Pro simulator can build this locally without EAS cloud credits. The `expo-build-properties` scene support setting is required for iOS 27. The app icon uses the existing square TenderCells logo from this repository.

From this directory: `npm ci`, `npm run typecheck`, `npx expo-doctor`, `npx expo prebuild --platform ios --no-install`, then run `pod install` from `ios/` with a UTF-8 locale. Build the Release scheme for an iOS simulator, install the `.app` with `xcrun simctl install`, and inspect the result on the simulator. The preview requires internet access to load the public demo.

# TenderCells mobile shell (Capacitor 7)

The iOS and Android apps wrap the root Vite web app (`dist/`) with Capacitor.

- App id `com.wecr8.tendercells`, name **TenderCells**, team N89RJCDD6U.
- iPhone + iPad (`TARGETED_DEVICE_FAMILY = "1,2"`, all four iPad orientations, `UIRequiresFullScreen = false`).
- Android phones + tablets (`<supports-screens>` small..xlarge, `resizeableActivity="true"`).
- iOS 15.0 minimum (Xcode 27 rejects lower); the Podfile `post_install` bumps Capacitor pods to 15.0.
- Xcode 27 / iOS 27 SDK requires the UIScene lifecycle: `SceneDelegate` lives in `AppDelegate.swift` and the
  scene manifest in `Info.plist` loads the `Main` storyboard.
- Icons/splash: `assets/` -> `npx capacitor-assets generate` (Android adaptive icon background is `@color/ic_launcher_background`).

Build locally (no cloud build services):

```bash
npm ci && npm run cap:sync
# iOS (unsigned archive; sign at export with the ASC API key)
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/TenderCells.xcarchive \
  CODE_SIGNING_ALLOWED=NO DEVELOPMENT_TEAM=N89RJCDD6U archive
# Android release APK (upload keystore is kept outside the repo)
cd android && ./gradlew assembleRelease -Pandroid.injected.signing.store.file=... \
  -Pandroid.injected.signing.store.password=... -Pandroid.injected.signing.key.alias=tendercells-upload \
  -Pandroid.injected.signing.key.password=...
```

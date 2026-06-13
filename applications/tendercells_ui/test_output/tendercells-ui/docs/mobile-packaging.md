# TenderCells Mobile Packaging

TenderCells is currently a responsive Vite/React PWA. The app can be tested on phones and tablets today through the browser install flow. Native iOS and Android packages are planned through Capacitor, but the `android/` and `ios/` native folders are not scaffolded yet.

Before packaging, run the engineering loop in `docs/engineering-loop.md`:

```bash
npm run quality:loop
npm run mobile:audit
```

## Current Mobile Target

- Responsive dashboard shell for phones, tablets, and desktop.
- Installable PWA assets in `public/manifest.json`.
- Local development on `http://localhost:5173`.
- Firebase Auth with email/password and Google provider.

## Install on Your Own Devices Today

PWA path:

- Android: open the live app or local network URL in Chrome, then use **Install app** or **Add to Home screen**.
- iOS/iPadOS: open the live app or local network URL in Safari, tap **Share**, then **Add to Home Screen**.
- Local hardware testing: run the dev server on the same network and use the machine LAN IP, for example `http://192.168.x.x:5173`.

Verification command:

```bash
npm run mobile:audit
```

Expected current result: PWA install/testing is ready; native Android/iOS packages are not scaffolded yet. The native wrapper checks show TODO until Capacitor is installed and platform folders are generated.

## Android Package Path

Recommended first native wrapper: Capacitor. This is not scaffolded yet.

Planned commands after dependency approval:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init TenderCells com.wecr8solutions.tendercells --web-dir dist
npm run build
npx cap add android
npx cap sync android
```

Required release assets:

- Android package id: `com.wecr8solutions.tendercells`
- Play signing or local upload keystore
- SHA-1 fingerprint for Firebase Auth Android app
- SHA-256 fingerprint for Play Integrity, Google Sign-In, and Firebase
- `google-services.json` from Firebase Console

## iOS Package Path

Recommended first native wrapper: Capacitor. This is not scaffolded yet.

Planned commands after dependency approval:

```bash
npm install @capacitor/ios
npm run build
npx cap add ios
npx cap sync ios
```

Required release assets:

- iOS bundle id: `com.wecr8solutions.tendercells`
- Apple Developer Team ID
- Distribution certificate
- App Store provisioning profile
- `GoogleService-Info.plist` from Firebase Console

## Release SHA Badge

Use this badge format once CI publishes release artifacts:

```md
![Release SHA](https://img.shields.io/badge/release%20sha-<short-sha>-6BBF59)
```

For automated releases, replace `<short-sha>` during CI with:

```bash
git rev-parse --short HEAD
```

## Community Release Checklist

- Build passes with `npm.cmd run build`.
- App loads on desktop, tablet width, and phone width.
- Login page shows email/password and Google sign-in.
- Chicken Tender, Roaming Roost, Predator Monitor, Products, Specs, and Property Layout routes render.
- Emergency stop controls remain visible and tappable on mobile.
- No Firebase secret files committed.
- Release notes include firmware compatibility and kit hardware revision.

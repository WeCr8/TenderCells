# TenderCells Usage Guide

TenderCells is an early open-source animal-care OS for homesteads, schools, makers, farmers, and developers.

## Run the Web App Locally

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm install
npm run dev
```

Open `http://localhost:5173`.

## Use the Super Nerd CLI

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm run tc -- help
npm run tc -- status
npm run tc -- check
npm run tc -- demo
npm run tc -- demo:watch
```

## Load Demo Animals

Go to `/birds` in the app and load product-aware demo animals. Use this before real hardware is ready.

Demo paths currently include:

- Chicken Tender
- Roaming Roost
- Duck Dock
- Bunny Burrow
- Goat Guardian
- Turkey Tower
- Pigeon Palace

## Register Products and Modules

Use `/products` to register:

- Purchased TenderCells products and kits
- DIY or 3D printed parts
- Custom product builds
- Door systems, waterers, feeders, cameras, sensors, rails, controller boards, and printed modules

Place products on the property layout so coops, corrals, obstacles, routes, cameras, and animals can be visualized together.

## Mobile Testing

PWA install/testing is ready today:

- Android: open the app in Chrome and choose Install app or Add to Home screen.
- iOS/iPadOS: open the app in Safari, tap Share, then Add to Home Screen.

Native Android/iOS packages are not scaffolded yet. Run:

```bash
npm run mobile:audit
```

## Verify Before Contributing

```bash
npm run essential:loop
npm run ui:smoke:desktop
```

These checks build the app, validate product routes, run OS contract tests, and smoke-test key browser flows.

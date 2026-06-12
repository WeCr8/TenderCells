# WatchTower AI™ Control App

Real-time predator detection and monitoring dashboard for WatchTower AI™ system.

## Features

- **Live Camera Feeds**: Real-time video from 3-camera dome system
- **Predator Detection**: AI-powered threat detection with confidence levels
- **Alert Management**: View and acknowledge predator and motion alerts
- **Recording Management**: Browse and download recorded footage
- **System Monitoring**: Battery, solar charge, and storage status
- **Responsive Design**: Works on desktop, tablet, and mobile

## Development

```bash
npm install
npm run dev   # Start dev server on port 5177
```

Visit http://localhost:5177

## Tech Stack

- React 18 + TypeScript
- Material-UI (MUI)
- Vite
- React Router

## Structure

```
src/
├── pages/          # Page components
├── components/     # Reusable UI components
│   ├── camera/     # Camera feed components
│   ├── alerts/     # Alert display components
│   ├── status/     # System status components
│   └── layout/     # Layout components
├── types/          # TypeScript interfaces
└── App.tsx         # Main app component
```

## Camera Positions

The dome houses 3 cameras at 120° intervals:
- **North**: Main property approach
- **East**: East perimeter
- **West**: West perimeter

Together, they provide 360° coverage with 120° FOV per camera.

## Alert Types

- **Predator**: High-confidence wildlife detection (raccoon, coyote, etc.)
- **Motion**: General motion detection events
- **Unknown**: Unclassified motion requiring review

Confidence levels (0-100%) indicate detection certainty.

## Recording Storage

- 256 GB local storage
- Auto-retention: Configurable (default 30 days)
- Quality options: 480p, 720p, 1080p
- Motion-triggered recording available

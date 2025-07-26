# Tender Cells Web Applications

Cross-platform web applications built with modern technologies and Firebase integration.

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and building
- **State Management**: React Context API / Redux Toolkit
- **Backend**: Firebase (Firestore, Auth, Functions)
- **AI/ML**: Google AI and Genkit integration
- **PWA**: Service Workers for offline functionality

## Applications

### 🐔 Chicken Tender
**Status**: Production Ready
- Real-time coop monitoring
- Temperature and humidity tracking
- Automated feeding schedules
- Health analytics dashboard
- Egg production insights

### 🐄 Cattle Care
**Status**: In Development
- Herd management interface
- Health monitoring dashboard
- Grazing area optimization
- Breeding cycle tracking

### 🐷 Pig Pal
**Status**: Planning
- Pig health monitoring
- Weight tracking system
- Feed optimization
- Growth analytics

### 🐐 Goat Guardian
**Status**: Planning
- Goat herd management
- Pasture rotation planning
- Milk production tracking
- Health monitoring

### 🦆 Duck Dock
**Status**: Planning
- Waterfowl management
- Pond monitoring
- Feeding optimization
- Egg collection tracking

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Firebase Configuration

Each application requires Firebase configuration:

```javascript
// firebase.config.js
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "tender-cells.firebaseapp.com",
  projectId: "tender-cells",
  storageBucket: "tender-cells.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Deployment

Web applications are deployed as Progressive Web Apps (PWAs) with offline capabilities.

```bash
# Build and deploy
npm run build
npm run deploy
```
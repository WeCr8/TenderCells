# Chicken Tender Web Application

The flagship Tender Cells application for intelligent chicken coop management.

## Features

### 🌡️ Climate Control
- Real-time temperature monitoring
- Humidity level tracking
- Automatic ventilation control
- Weather integration and alerts

### 🍽️ Smart Feeding
- Automated feeding schedules
- Feed level monitoring
- Nutritional tracking
- Custom feeding programs

### 📊 Health Analytics
- AI-powered health insights
- Behavior pattern analysis
- Disease early detection
- Veterinary recommendations

### 🥚 Egg Production
- Daily egg count tracking
- Production trend analysis
- Quality assessment
- Collection scheduling

### 🔔 Smart Alerts
- Real-time notifications
- Emergency alerts
- Maintenance reminders
- Health warnings

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Chart.js with react-chartjs-2
- **Real-time**: Firebase Firestore
- **AI**: Google Generative AI (Gemini)
- **PWA**: Workbox for offline support

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project setup
- Google AI API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and Google AI credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## Project Structure

```
src/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── monitoring/
│   └── settings/
├── hooks/
├── services/
│   ├── firebase/
│   └── ai/
├── stores/
├── types/
├── utils/
└── pages/
```

## Key Components

### Dashboard
- Overview of all coop metrics
- Quick action buttons
- Recent alerts and notifications
- Weather information

### Monitoring
- Real-time sensor data
- Historical charts and graphs
- Environmental controls
- Camera feed integration

### Analytics
- AI-powered insights
- Health trend analysis
- Production reports
- Predictive alerts

### Settings
- Coop configuration
- User preferences
- Notification settings
- Device management

## Firebase Integration

### Firestore Collections
```javascript
// Coops collection
coops/{coopId} {
  name: string,
  location: GeoPoint,
  sensors: array,
  settings: object,
  createdAt: timestamp
}

// Sensor data collection
sensorData/{coopId}/readings/{timestamp} {
  temperature: number,
  humidity: number,
  feedLevel: number,
  waterLevel: number,
  timestamp: timestamp
}

// Alerts collection
alerts/{alertId} {
  coopId: string,
  type: string,
  severity: string,
  message: string,
  resolved: boolean,
  timestamp: timestamp
}
```

### Real-time Listeners
```javascript
// Listen to sensor data changes
const unsubscribe = onSnapshot(
  collection(db, `sensorData/${coopId}/readings`),
  (snapshot) => {
    const readings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    updateSensorData(readings);
  }
);
```

## AI Integration

### Google Generative AI
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_AI_API_KEY);

// Analyze chicken health data
const analyzeHealthData = async (sensorData, behaviorData) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
    Analyze this chicken coop data and provide health insights:
    Temperature: ${sensorData.temperature}°F
    Humidity: ${sensorData.humidity}%
    Activity Level: ${behaviorData.activity}
    Feed Consumption: ${behaviorData.feedConsumption}
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### PWA Features
- Offline functionality
- Push notifications
- App-like experience
- Background sync

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details
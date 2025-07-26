# Tender Cells Android Applications

Native Android applications built with Kotlin and Jetpack Compose, integrated with Firebase backend.

## Technology Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with LiveData/StateFlow
- **Backend**: Firebase Android SDK
- **AI/ML**: Google AI SDK for Android
- **Dependencies**: Gradle with Version Catalogs
- **Minimum SDK**: API 24 (Android 7.0)
- **Target SDK**: API 34 (Android 14)

## Applications

### 🐔 Chicken Tender
**Status**: Production Ready
- Material Design 3 interface
- Real-time push notifications via FCM
- Offline-first architecture with Room database
- Widget support for quick monitoring
- Android Auto integration for hands-free access

### 🐄 Cattle Care
**Status**: In Development
- Herd management with local database
- GPS tracking with Google Maps integration
- Camera integration for health documentation
- Notification scheduling for health checks

### 🐷 Pig Pal
**Status**: Planning
- Weight tracking with chart visualizations
- Feeding schedule with alarms
- Health monitoring dashboard
- Data export capabilities

### 🐐 Goat Guardian
**Status**: Planning
- Pasture management with GPS boundaries
- Milk production tracking
- Breeding calendar with reminders
- Health record management

### 🦆 Duck Dock
**Status**: Planning
- Pond monitoring interface
- Weather API integration
- Feeding optimization algorithms
- Egg collection tracking

## Development Setup

### Prerequisites
- Android Studio Hedgehog or later
- JDK 17
- Android SDK with API 24-34
- Firebase Android SDK
- Google Play Services

### Installation

```bash
# Clone the repository
git clone https://github.com/tendercells/android-apps.git

# Open in Android Studio
# File -> Open -> Select project directory
```

### Firebase Setup

1. Download `google-services.json` from Firebase Console
2. Place in `app/` directory
3. Configure Firebase in `Application` class:

```kotlin
class TenderCellsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}
```

## Architecture

### MVVM with Clean Architecture
- **Data Layer**: Repository pattern with Firebase and Room
- **Domain Layer**: Use cases and business logic
- **Presentation Layer**: ViewModels and Compose UI

### Project Structure
```
app/
├── src/main/java/com/tendercells/
│   ├── data/
│   │   ├── local/
│   │   ├── remote/
│   │   └── repository/
│   ├── domain/
│   │   ├── model/
│   │   ├── repository/
│   │   └── usecase/
│   ├── presentation/
│   │   ├── ui/
│   │   ├── viewmodel/
│   │   └── theme/
│   └── di/
├── src/test/
└── src/androidTest/
```

## Dependencies

### Core Dependencies
```kotlin
// Jetpack Compose
implementation "androidx.compose.ui:ui:$compose_version"
implementation "androidx.compose.material3:material3:$material3_version"

// Firebase
implementation "com.google.firebase:firebase-firestore-ktx"
implementation "com.google.firebase:firebase-auth-ktx"
implementation "com.google.firebase:firebase-messaging-ktx"

// Google AI
implementation "com.google.ai.client.generativeai:generativeai:$genai_version"

// Architecture Components
implementation "androidx.lifecycle:lifecycle-viewmodel-compose"
implementation "androidx.navigation:navigation-compose"
```

## Google Play Distribution

### Build Variants
- **Debug**: Development builds with Firebase emulator
- **Staging**: Internal testing builds
- **Release**: Google Play Store distribution

### Play Store Guidelines
- Follow Material Design principles
- Implement proper permissions handling
- Optimize for different screen sizes
- Support Android accessibility features

## Testing

```bash
# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Run specific test suite
./gradlew testDebugUnitTest
```

## Continuous Integration

GitHub Actions workflow for automated testing and building:

```yaml
name: Android CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: ./gradlew test
```
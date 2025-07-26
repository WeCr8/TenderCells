# Tender Cells iOS Applications

Native iOS applications built with Swift and SwiftUI, integrated with Firebase backend.

## Technology Stack

- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI
- **Architecture**: MVVM (Model-View-ViewModel)
- **Backend**: Firebase iOS SDK
- **AI/ML**: Google AI SDK for iOS
- **Dependencies**: Swift Package Manager
- **Minimum iOS**: iOS 15.0+

## Applications

### 🐔 Chicken Tender
**Status**: Production Ready
- Native iOS interface optimized for iPhone and iPad
- Real-time push notifications
- Offline data synchronization
- Apple Watch companion app support
- Siri Shortcuts integration

### 🐄 Cattle Care
**Status**: In Development
- Herd management with Core Data
- Location tracking with MapKit
- Health alerts and reminders
- Photo documentation with Camera integration

### 🐷 Pig Pal
**Status**: Planning
- Weight tracking with HealthKit integration
- Feeding schedule notifications
- Growth chart visualizations
- Health monitoring dashboard

### 🐐 Goat Guardian
**Status**: Planning
- Pasture management with GPS
- Milk production tracking
- Breeding cycle calendar
- Health record management

### 🦆 Duck Dock
**Status**: Planning
- Pond monitoring interface
- Weather integration
- Feeding schedule optimization
- Egg collection tracking

## Development Setup

### Prerequisites
- Xcode 14.0 or later
- iOS 15.0+ deployment target
- Apple Developer Account (for device testing and App Store)
- Firebase iOS SDK

### Installation

```bash
# Clone the repository
git clone https://github.com/tendercells/ios-apps.git

# Open in Xcode
open TenderCells.xcodeproj
```

### Firebase Setup

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to Xcode project
3. Configure Firebase in `AppDelegate.swift`:

```swift
import Firebase
import FirebaseAuth
import FirebaseFirestore

@main
struct TenderCellsApp: App {
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

## Architecture

### MVVM Pattern
- **Models**: Data structures and Firebase models
- **Views**: SwiftUI views and components
- **ViewModels**: Business logic and state management
- **Services**: Firebase services and API calls

### Project Structure
```
TenderCells/
├── Models/
├── Views/
├── ViewModels/
├── Services/
├── Utilities/
├── Resources/
└── Supporting Files/
```

## App Store Distribution

### Build Configuration
- Development: Debug builds with Firebase emulator
- Staging: TestFlight distribution
- Production: App Store release

### App Store Guidelines
- Follow Apple Human Interface Guidelines
- Implement proper privacy policies
- Handle permissions appropriately
- Optimize for different device sizes

## Testing

```bash
# Run unit tests
xcodebuild test -scheme TenderCells

# Run UI tests
xcodebuild test -scheme TenderCellsUITests
```
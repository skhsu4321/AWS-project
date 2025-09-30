# 🌱 Finance Farm Simulator

A gamified financial management mobile app that transforms financial tasks into an engaging farm simulation experience.

## 📖 Documentation

### 🎯 For Beginners (English/中文)
- **📱 [App Overview Guide](docs/APP_OVERVIEW_GUIDE.html)** - Learn about the app features and technology
- **🛠️ [Setup & Testing Guide](docs/SETUP_TESTING_GUIDE.html)** - Step-by-step setup and testing instructions

### 👨‍💻 For Developers
- **📚 [All Documentation](docs/index.html)** - Documentation hub with all guides

### Quick Links
- 🚀 [Quick Start Guide](docs/setup/QUICK_START_GUIDE.md)
- 🔧 [Manual Setup](docs/setup/MANUAL_SETUP.md)
- 🧪 [Testing Alternatives](docs/testing/TESTING_ALTERNATIVES.md)
- 📊 [Implementation Docs](docs/implementation/)

## 📁 Project Structure

```
FinanceFarmSimulator/
├── 📁 src/                          # Main source code
│   ├── 📁 components/               # React components by feature
│   │   ├── 📁 accessibility/        # Accessibility components
│   │   ├── 📁 analytics/           # Analytics components
│   │   ├── 📁 auth/                # Authentication components
│   │   ├── 📁 child/               # Child mode components
│   │   ├── 📁 common/              # Reusable components
│   │   ├── 📁 expenses/            # Expense tracking
│   │   ├── 📁 farm/                # Farm visualization
│   │   ├── 📁 financial/           # Financial components
│   │   ├── 📁 goals/               # Goal management
│   │   ├── 📁 income/              # Income logging
│   │   ├── 📁 integration/         # App integration
│   │   └── 📁 performance/         # Performance components
│   ├── 📁 screens/                 # Screen components
│   │   ├── 📁 analytics/           # Analytics screens
│   │   ├── 📁 auth/                # Authentication screens
│   │   ├── 📁 child/               # Child mode screens
│   │   ├── 📁 expenses/            # Expense screens
│   │   ├── 📁 goals/               # Goal screens
│   │   ├── 📁 income/              # Income screens
│   │   └── 📁 settings/            # Settings screens
│   ├── 📁 services/                # Business logic & APIs
│   │   └── 📁 dao/                 # Data Access Objects
│   ├── 📁 store/                   # Redux store
│   │   ├── 📁 selectors/           # Redux selectors
│   │   └── 📁 slices/              # Redux slices
│   ├── 📁 navigation/              # Navigation configuration
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 models/                  # TypeScript interfaces/types
│   ├── 📁 utils/                   # Utility functions
│   ├── 📁 theme/                   # Theme configuration
│   ├── 📁 contexts/                # React contexts
│   ├── 📁 config/                  # App configuration
│   ├── 📁 __tests__/               # Test files
│   │   ├── 📁 e2e/                 # End-to-end tests
│   │   ├── 📁 integration/         # Integration tests
│   │   ├── 📁 performance/         # Performance tests
│   │   └── 📁 security/            # Security tests
│   └── 📁 __mocks__/               # Test mocks
├── 📁 docs/                        # Documentation
│   ├── 📁 implementation/          # Feature documentation
│   ├── 📁 setup/                   # Setup guides
│   ├── 📁 summaries/               # Project summaries
│   └── 📁 testing/                 # Testing documentation
├── 📁 scripts/                     # Build and deployment scripts
├── 📁 demo/                        # Demo files
└── 📁 assets/                      # Static assets
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Quick Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```bash
   npm run web
   ```

### Alternative Setup Methods

**Windows Users:**
```bash
# Quick start script
./quick-start.bat
```

**PowerShell Users:**
```bash
# PowerShell script
./quick-start.ps1
```

**Having Issues?**
- 🛠️ Check [SETUP_TESTING_GUIDE.html](docs/SETUP_TESTING_GUIDE.html) for step-by-step setup
- 🔧 Use [setup-checker.html](docs/setup/setup-checker.html) to validate your environment
- 📖 Follow [MANUAL_SETUP.md](docs/setup/MANUAL_SETUP.md) for detailed instructions

### Available Scripts

#### Development
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

#### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:performance` - Run performance tests
- `npm run test:security` - Run security tests
- `npm run test:accessibility` - Run accessibility tests
- `npm run test:all` - Run all test suites
- `npm run test:ci` - Run tests for CI environment
- `npm run test:final` - Run final testing script

#### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

#### Build & Deployment
- `npm run build` - Build the app
- `npm run build:dev` - Build for development
- `npm run build:preview` - Build for preview
- `npm run build:production` - Build for production
- `npm run deploy:dev` - Deploy to development
- `npm run deploy:preview` - Deploy to preview
- `npm run deploy:production` - Deploy to production
- `npm run update:preview` - OTA update for preview
- `npm run update:production` - OTA update for production

#### Readiness Checks
- `npm run readiness:check` - Check deployment readiness
- `npm run readiness:quick` - Quick readiness check

## Technology Stack

### Core Framework
- **Framework**: React Native with Expo (~54.0.10)
- **Language**: TypeScript (~5.9.2)
- **React**: 19.1.0
- **React Native**: 0.81.4

### State Management & Navigation
- **State Management**: Redux Toolkit with React Redux
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Routing**: Expo Router

### Database & Storage
- **Database**: SQLite (expo-sqlite)
- **Storage**: AsyncStorage
- **Cloud**: Firebase

### UI & Animation
- **Animation**: React Native Reanimated & Worklets
- **Graphics**: React Native Skia, React Native SVG
- **Charts**: React Native Chart Kit
- **Gestures**: React Native Gesture Handler

### Development Tools
- **Testing**: Jest with ts-jest, React Native Testing Library
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Build**: EAS Build
- **Type Checking**: TypeScript with strict mode

### Additional Features
- **Camera**: Expo Camera & Vision Camera
- **Voice**: React Native Voice
- **Accessibility**: Built-in React Native accessibility
- **Offline Support**: NetInfo for connectivity detection
- **Security**: Expo Crypto for encryption
- **Validation**: Zod for schema validation

## Features

- User authentication with age-appropriate modes
- Gamified savings goals as virtual crops
- Expense tracking with "weed pulling" mechanics
- Income logging with "fertilizer" bonuses
- Interactive farm visualization
- Parental controls for child accounts
- Financial analytics and reporting
- Offline functionality with data synchronization

## Development Guidelines

- Follow TypeScript best practices
- Write tests for all utility functions and business logic
- Use meaningful component and variable names
- Follow the established folder structure
- Run linting and formatting before committing
- Ensure all tests pass before submitting changes

## License

This project is private and proprietary.
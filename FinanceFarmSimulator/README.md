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
- 🧪 [Testing Alternatives](docs/TESTING_ALTERNATIVES.md)
- 📊 [Implementation Docs](docs/implementation/)

## 📁 Project Structure

```
FinanceFarmSimulator/
├── 📁 src/                          # Main source code
│   ├── 📁 components/               # React components by feature
│   │   ├── 📁 accessibility/        # Accessibility components
│   │   ├── 📁 analytics/           # Analytics components
│   │   ├── 📁 child/               # Child mode components
│   │   ├── 📁 common/              # Reusable components
│   │   ├── 📁 expenses/            # Expense tracking
│   │   ├── 📁 farm/                # Farm visualization
│   │   ├── 📁 goals/               # Goal management
│   │   ├── 📁 income/              # Income logging
│   │   └── 📁 integration/         # App integration
│   ├── 📁 screens/                 # Screen components
│   ├── 📁 services/                # Business logic
│   ├── 📁 store/                   # Redux store
│   ├── 📁 hooks/                   # Custom hooks
│   └── 📁 __tests__/               # Test files
├── 📁 docs/                        # Documentation
│   ├── 📁 implementation/          # Feature docs
│   └── 📁 setup/                   # Setup guides
├── 📁 scripts/                     # Build scripts
└── 📁 demo/                        # Demo files
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

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Database**: SQLite (expo-sqlite)
- **Animation**: React Native Reanimated
- **Testing**: Jest with ts-jest
- **Linting**: ESLint
- **Formatting**: Prettier

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
# Finance Farm Simulator

A gamified financial management mobile app that transforms financial tasks into an engaging farm simulation experience.

## Project Structure

```
src/
├── components/          # React Native UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   ├── farm/           # Farm-related components
│   └── financial/      # Financial management components
├── navigation/         # React Navigation configuration
├── screens/           # Screen components
├── services/          # Business logic and API services
├── store/             # Redux store and slices
├── models/            # TypeScript interfaces and types
└── utils/             # Utility functions and constants
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

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
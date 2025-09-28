# Finance Farm Simulator - Design Document

## Overview

The Finance Farm Simulator is a cross-platform mobile application that gamifies financial management through a farm simulation interface. The app transforms traditional financial tasks into engaging activities where users plant savings goals as crops, manage expenses as weeds, and apply income as fertilizer. The system supports both adult and child users with appropriate interfaces and parental controls.

## Architecture

### High-Level Architecture

The application follows a layered architecture pattern optimized for mobile development:

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│  (React Native / Flutter UI)       │
├─────────────────────────────────────┤
│           Business Logic Layer      │
│  (Game Engine, Financial Logic)    │
├─────────────────────────────────────┤
│           Data Access Layer        │
│  (Local Storage, Cloud Sync)       │
├─────────────────────────────────────┤
│           Platform Layer           │
│  (iOS/Android Native APIs)        │
└─────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React Native for cross-platform compatibility
- **State Management**: Redux Toolkit for predictable state management
- **Local Database**: SQLite with React Native SQLite Storage
- **Animation Engine**: React Native Reanimated 3 for smooth farm animations
- **Graphics Rendering**: React Native Skia for custom 2D graphics
- **Authentication**: Firebase Auth for secure user management
- **Cloud Storage**: Firebase Firestore for optional data sync
- **Image Processing**: React Native Vision Camera + ML Kit for receipt scanning

## Components and Interfaces

### Core Components

#### 1. Authentication Module
```typescript
interface AuthService {
  register(email: string, password: string, userProfile: UserProfile): Promise<User>
  login(email: string, password: string): Promise<User>
  socialLogin(provider: 'google' | 'apple'): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): User | null
}

interface UserProfile {
  age: number
  mode: 'adult' | 'child'
  currency: string
  parentAccountId?: string
}
```

#### 2. Farm Engine
```typescript
interface FarmEngine {
  initializeFarm(userId: string): Promise<Farm>
  updateFarmState(): void
  calculateGrowthRate(goal: SavingsGoal): number
  applyFertilizer(amount: number, multiplier: number): void
  processWeeds(expenses: Expense[]): void
  triggerHarvest(goalId: string): Promise<Reward[]>
}

interface Farm {
  id: string
  userId: string
  crops: Crop[]
  layout: FarmLayout
  healthScore: number
  lastUpdated: Date
}
```

#### 3. Financial Data Manager
```typescript
interface FinancialDataManager {
  createSavingsGoal(goal: SavingsGoalInput): Promise<SavingsGoal>
  logExpense(expense: ExpenseInput): Promise<Expense>
  logIncome(income: IncomeInput): Promise<Income>
  getFinancialSummary(userId: string, period: TimePeriod): Promise<FinancialSummary>
  generateReport(userId: string, reportType: ReportType): Promise<Report>
}
```

#### 4. Parental Control System
```typescript
interface ParentalControlService {
  linkChildAccount(parentId: string, childId: string): Promise<void>
  approveGoal(goalId: string, approved: boolean): Promise<void>
  setAllowance(childId: string, amount: number, frequency: string): Promise<void>
  getChildActivity(childId: string): Promise<ChildActivity[]>
  configureRestrictions(childId: string, restrictions: Restrictions): Promise<void>
}
```

### User Interface Components

#### 1. Farm Visualization Component
- **Purpose**: Renders the interactive farm with crops, animations, and user interactions
- **Key Features**: Zoom/pan functionality, real-time growth animations, tap interactions
- **Performance**: Optimized rendering using React Native Skia for 60fps animations

#### 2. Goal Management Interface
- **Adult Mode**: Full financial input forms with currency formatting and deadline selection
- **Child Mode**: Simplified forms with visual aids and parental approval workflows

#### 3. Expense Tracking Interface
- **Weed Pulling Mechanic**: Drag-and-drop interface for expense categorization
- **Receipt Scanner**: Camera integration for automatic expense detection and categorization
- **Budget Alerts**: Visual feedback when spending exceeds thresholds

#### 4. Analytics Dashboard
- **Charts**: Interactive pie charts and line graphs for spending patterns
- **Progress Indicators**: Visual progress bars and growth metrics
- **Insights**: AI-generated recommendations based on spending patterns

## Data Models

### User and Authentication
```typescript
interface User {
  id: string
  email: string
  profile: UserProfile
  createdAt: Date
  lastLoginAt: Date
}

interface UserProfile {
  displayName: string
  age: number
  mode: 'adult' | 'child'
  currency: string
  timezone: string
  parentAccountId?: string
  preferences: UserPreferences
}
```

### Financial Data Models
```typescript
interface SavingsGoal {
  id: string
  userId: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: GoalCategory
  cropType: CropType
  createdAt: Date
  status: 'active' | 'completed' | 'paused'
}

interface Expense {
  id: string
  userId: string
  amount: number
  category: ExpenseCategory
  description: string
  date: Date
  receiptImage?: string
  isRecurring: boolean
  tags: string[]
}

interface Income {
  id: string
  userId: string
  amount: number
  source: IncomeSource
  description: string
  date: Date
  isRecurring: boolean
  multiplier: number
}
```

### Game Data Models
```typescript
interface Crop {
  id: string
  goalId: string
  type: CropType
  growthStage: GrowthStage
  healthPoints: number
  position: Position
  plantedAt: Date
  harvestableAt?: Date
}

interface Farm {
  id: string
  userId: string
  layout: FarmLayout
  crops: Crop[]
  decorations: Decoration[]
  healthScore: number
  level: number
  experience: number
}

interface Reward {
  id: string
  type: RewardType
  title: string
  description: string
  value: number
  unlockedAt: Date
  category: 'badge' | 'decoration' | 'boost' | 'customization'
}
```

## Error Handling

### Error Categories and Responses

1. **Network Errors**
   - Graceful degradation to offline mode
   - Queue sync operations for when connection returns
   - User-friendly offline indicators

2. **Data Validation Errors**
   - Real-time form validation with helpful messages
   - Prevent invalid financial data entry
   - Age-appropriate error messages for child mode

3. **Authentication Errors**
   - Clear messaging for login failures
   - Password reset flows
   - Parental verification for child accounts

4. **Game State Errors**
   - Automatic farm state recovery
   - Progress preservation during crashes
   - Rollback mechanisms for corrupted data

### Error Recovery Strategies
```typescript
interface ErrorHandler {
  handleNetworkError(error: NetworkError): Promise<void>
  handleValidationError(error: ValidationError): void
  handleAuthError(error: AuthError): Promise<void>
  recoverGameState(userId: string): Promise<Farm>
}
```

## Testing Strategy

### Unit Testing
- **Financial Calculations**: Test growth algorithms, budget calculations, and reward systems
- **Data Models**: Validate data integrity and business logic
- **Utility Functions**: Test currency formatting, date calculations, and validation functions

### Integration Testing
- **API Integration**: Test Firebase authentication and Firestore operations
- **Cross-Component Communication**: Verify data flow between farm engine and UI components
- **Platform-Specific Features**: Test camera integration and local storage

### User Experience Testing
- **Adult Mode Workflows**: Complete financial goal creation and tracking flows
- **Child Mode Workflows**: Test simplified interfaces and parental approval processes
- **Cross-Platform Consistency**: Ensure identical behavior on iOS and Android

### Performance Testing
- **Animation Performance**: Maintain 60fps during farm interactions
- **Memory Usage**: Optimize for devices with limited RAM
- **Battery Impact**: Minimize background processing and optimize rendering

### Security Testing
- **Data Encryption**: Verify local data encryption and secure transmission
- **Authentication Security**: Test session management and token handling
- **Parental Controls**: Ensure child account restrictions are properly enforced

## Implementation Considerations

### Offline-First Design
- All core functionality available without internet connection
- Automatic sync when connection is restored
- Conflict resolution for data modified offline

### Accessibility
- Screen reader support for visually impaired users
- High contrast mode for better visibility
- Voice commands for expense logging
- Simplified navigation for users with motor difficulties

### Localization
- Multi-language support with Hong Kong focus
- Currency formatting for different regions
- Cultural adaptation of farm themes and rewards
- Age-appropriate financial terminology

### Performance Optimization
- Lazy loading of farm assets and animations
- Efficient state management to prevent unnecessary re-renders
- Image compression for receipt storage
- Background processing for growth calculations

### Security and Privacy
- End-to-end encryption for sensitive financial data
- Minimal data collection with explicit user consent
- Secure parental verification processes
- Regular security audits and updates
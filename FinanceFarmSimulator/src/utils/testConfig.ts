// Test configuration and constants
export const TEST_CONFIG = {
  // Performance thresholds
  PERFORMANCE: {
    MAX_RENDER_TIME: 16, // 60fps budget in milliseconds
    MAX_ANIMATION_FRAME_TIME: 16,
    MAX_TOUCH_LATENCY: 100,
    MIN_FRAME_RATE: 55,
    MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
    MAX_MEMORY_LEAK: 5 * 1024 * 1024, // 5MB
  },
  
  // Security settings
  SECURITY: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    ENCRYPTION_KEY_LENGTH: 32,
  },
  
  // Test data limits
  DATA: {
    MAX_TEST_USERS: 100,
    MAX_TEST_GOALS: 50,
    MAX_TEST_EXPENSES: 200,
    MAX_TEST_CROPS: 50,
  },
  
  // API timeouts
  TIMEOUTS: {
    API_REQUEST: 5000,
    DATABASE_OPERATION: 3000,
    ANIMATION_COMPLETE: 2000,
    USER_INTERACTION: 1000,
  },
  
  // Test environment settings
  ENVIRONMENT: {
    MOCK_FIREBASE: true,
    MOCK_CAMERA: true,
    MOCK_STORAGE: true,
    ENABLE_LOGGING: false,
  },
};

// Test utilities
export const TEST_UTILS = {
  // Generate test IDs
  generateTestId: (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Wait for condition
  waitForCondition: async (condition: () => boolean, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
  
  // Mock async operation
  mockAsyncOperation: <T>(result: T, delay = 100): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(result), delay));
  },
  
  // Generate random test data
  generateRandomString: (length = 10) => Math.random().toString(36).substr(2, length),
  generateRandomNumber: (min = 0, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
  generateRandomEmail: () => `test-${Date.now()}@example.com`,
  
  // Performance measurement
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  },
  
  // Memory usage tracking
  getMemoryUsage: () => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },
};

// Test assertions
export const TEST_ASSERTIONS = {
  // Performance assertions
  assertRenderTime: (time: number) => {
    expect(time).toBeLessThan(TEST_CONFIG.PERFORMANCE.MAX_RENDER_TIME);
  },
  
  assertFrameRate: (frameRate: number) => {
    expect(frameRate).toBeGreaterThan(TEST_CONFIG.PERFORMANCE.MIN_FRAME_RATE);
  },
  
  assertMemoryUsage: (usage: number) => {
    expect(usage).toBeLessThan(TEST_CONFIG.PERFORMANCE.MAX_MEMORY_USAGE);
  },
  
  // Security assertions
  assertPasswordStrength: (password: string) => {
    expect(password.length).toBeGreaterThanOrEqual(TEST_CONFIG.SECURITY.MIN_PASSWORD_LENGTH);
    expect(password).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/);
  },
  
  assertEncryptedData: (data: string) => {
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
  },
  
  // Data validation assertions
  assertValidEmail: (email: string) => {
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  },
  
  assertValidCurrency: (amount: number) => {
    expect(amount).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(amount)).toBe(true);
  },
  
  assertValidDate: (date: Date) => {
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).not.toBeNaN();
  },
};

// Mock data generators
export const MOCK_DATA_GENERATORS = {
  user: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('user'),
    email: TEST_UTILS.generateRandomEmail(),
    profile: {
      displayName: `Test User ${TEST_UTILS.generateRandomString(5)}`,
      age: TEST_UTILS.generateRandomNumber(18, 65),
      mode: 'adult' as const,
      currency: 'HKD',
      timezone: 'Asia/Hong_Kong',
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en',
      },
    },
    createdAt: new Date(),
    lastLoginAt: new Date(),
    ...overrides,
  }),
  
  childUser: (overrides = {}) => ({
    ...MOCK_DATA_GENERATORS.user(),
    profile: {
      ...MOCK_DATA_GENERATORS.user().profile,
      age: TEST_UTILS.generateRandomNumber(6, 17),
      mode: 'child' as const,
      parentAccountId: TEST_UTILS.generateTestId('parent'),
    },
    ...overrides,
  }),
  
  savingsGoal: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('goal'),
    userId: TEST_UTILS.generateTestId('user'),
    title: `Goal ${TEST_UTILS.generateRandomString(5)}`,
    description: `Description for goal ${TEST_UTILS.generateRandomString(10)}`,
    targetAmount: TEST_UTILS.generateRandomNumber(1000, 50000),
    currentAmount: TEST_UTILS.generateRandomNumber(0, 10000),
    deadline: new Date(Date.now() + TEST_UTILS.generateRandomNumber(7, 365) * 24 * 60 * 60 * 1000),
    category: 'general' as const,
    cropType: 'apple' as const,
    createdAt: new Date(),
    status: 'active' as const,
    ...overrides,
  }),
  
  expense: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('expense'),
    userId: TEST_UTILS.generateTestId('user'),
    amount: TEST_UTILS.generateRandomNumber(10, 1000),
    category: 'food' as const,
    description: `Expense ${TEST_UTILS.generateRandomString(8)}`,
    date: new Date(),
    isRecurring: false,
    tags: [`tag${TEST_UTILS.generateRandomString(3)}`],
    ...overrides,
  }),
  
  income: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('income'),
    userId: TEST_UTILS.generateTestId('user'),
    amount: TEST_UTILS.generateRandomNumber(1000, 10000),
    source: 'salary' as const,
    description: `Income ${TEST_UTILS.generateRandomString(8)}`,
    date: new Date(),
    isRecurring: true,
    multiplier: 1 + Math.random() * 2,
    ...overrides,
  }),
  
  farm: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('farm'),
    userId: TEST_UTILS.generateTestId('user'),
    layout: {
      width: 400,
      height: 300,
      plots: [],
    },
    crops: [],
    decorations: [],
    healthScore: TEST_UTILS.generateRandomNumber(50, 100),
    level: TEST_UTILS.generateRandomNumber(1, 10),
    experience: TEST_UTILS.generateRandomNumber(0, 5000),
    ...overrides,
  }),
  
  crop: (overrides = {}) => ({
    id: TEST_UTILS.generateTestId('crop'),
    goalId: TEST_UTILS.generateTestId('goal'),
    type: 'apple' as const,
    growthStage: TEST_UTILS.generateRandomNumber(0, 4),
    healthPoints: TEST_UTILS.generateRandomNumber(50, 100),
    position: {
      x: TEST_UTILS.generateRandomNumber(0, 400),
      y: TEST_UTILS.generateRandomNumber(0, 300),
    },
    plantedAt: new Date(),
    ...overrides,
  }),
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock global objects
  global.performance = global.performance || {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1024 * 1024, // 1MB
      totalJSHeapSize: 10 * 1024 * 1024, // 10MB
      jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
    },
  };
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = global.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = global.cancelAnimationFrame || clearTimeout;
  
  // Mock console methods for cleaner test output
  if (!TEST_CONFIG.ENVIRONMENT.ENABLE_LOGGING) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
  
  // Set up test timeouts
  jest.setTimeout(TEST_CONFIG.TIMEOUTS.API_REQUEST * 2);
};

// Cleanup test environment
export const cleanupTestEnvironment = () => {
  // Restore console methods
  if (jest.isMockFunction(console.log)) {
    (console.log as jest.MockedFunction<typeof console.log>).mockRestore();
  }
  if (jest.isMockFunction(console.warn)) {
    (console.warn as jest.MockedFunction<typeof console.warn>).mockRestore();
  }
  if (jest.isMockFunction(console.error)) {
    (console.error as jest.MockedFunction<typeof console.error>).mockRestore();
  }
  
  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();
};
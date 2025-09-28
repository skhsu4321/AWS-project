module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/utils/testSetup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/utils/testSetup.ts',
    '!src/utils/testHelpers.ts',
    '!src/utils/testConfig.ts',
    '!src/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-crypto|expo-sqlite|@expo|expo|uuid|react-native|@react-native|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto.js',
    '^expo-sqlite$': '<rootDir>/src/__mocks__/expo-sqlite.js',
    '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  // Test environment configuration
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // Different configurations for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        'integration',
        'e2e',
        'performance',
        'security',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}'],
      testTimeout: 30000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.{ts,tsx}'],
      testTimeout: 60000,
      maxWorkers: 1, // Run E2E tests sequentially
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/__tests__/performance/**/*.test.{ts,tsx}'],
      testTimeout: 30000,
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/src/__tests__/security/**/*.test.{ts,tsx}'],
      testTimeout: 20000,
    },
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }],
  ],
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: true,
  logHeapUsage: true,
};
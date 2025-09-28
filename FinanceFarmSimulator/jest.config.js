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
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
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
};
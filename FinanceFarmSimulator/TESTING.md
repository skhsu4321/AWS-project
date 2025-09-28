# Testing Documentation

This document describes the comprehensive testing strategy and implementation for the Finance Farm Simulator application.

## Overview

The testing suite covers all aspects of the application including:
- Unit tests for business logic and utility functions
- Integration tests for API calls and data flow
- End-to-end tests for critical user workflows
- Performance tests for animation and rendering
- Security tests for authentication and data protection

## Test Structure

```
src/
├── __tests__/
│   ├── integration/          # Integration tests
│   ├── e2e/                 # End-to-end tests
│   ├── performance/         # Performance tests
│   └── security/            # Security tests
├── components/
│   └── **/__tests__/        # Component unit tests
├── services/
│   └── __tests__/           # Service unit tests
├── utils/
│   ├── __tests__/           # Utility unit tests
│   ├── testHelpers.ts       # Test utilities and helpers
│   ├── testConfig.ts        # Test configuration
│   └── testSetup.ts         # Global test setup
└── __mocks__/               # Mock implementations
```

## Test Types

### 1. Unit Tests

Unit tests focus on individual functions, components, and services in isolation.

**Location**: `src/**/__tests__/**/*.test.{ts,tsx}`

**Coverage**:
- Business logic calculations (growth rates, fertilizer effects, etc.)
- Utility functions (formatting, validation, etc.)
- Component rendering and behavior
- Service methods and error handling

**Running**:
```bash
npm run test:unit
```

### 2. Integration Tests

Integration tests verify the interaction between different parts of the system.

**Location**: `src/__tests__/integration/**/*.test.{ts,tsx}`

**Coverage**:
- API calls and data flow
- Database operations
- Service interactions
- State management integration

**Running**:
```bash
npm run test:integration
```

### 3. End-to-End Tests

E2E tests simulate complete user workflows from start to finish.

**Location**: `src/__tests__/e2e/**/*.test.{ts,tsx}`

**Coverage**:
- User registration and authentication
- Goal creation and management
- Expense tracking workflows
- Farm interaction and visualization
- Child mode functionality

**Running**:
```bash
npm run test:e2e
```

### 4. Performance Tests

Performance tests ensure the application meets performance requirements.

**Location**: `src/__tests__/performance/**/*.test.{ts,tsx}`

**Coverage**:
- Animation frame rates (60fps target)
- Rendering performance
- Memory usage and leak detection
- Touch response latency

**Running**:
```bash
npm run test:performance
```

### 5. Security Tests

Security tests verify authentication, authorization, and data protection.

**Location**: `src/__tests__/security/**/*.test.{ts,tsx}`

**Coverage**:
- Password strength validation
- Session management
- Data encryption/decryption
- Input sanitization
- Brute force protection

**Running**:
```bash
npm run test:security
```

## Test Configuration

### Jest Configuration

The Jest configuration supports multiple test types with different settings:

- **Unit tests**: Fast execution, isolated environment
- **Integration tests**: Database and API mocking
- **E2E tests**: Sequential execution, full app simulation
- **Performance tests**: Memory and timing measurements
- **Security tests**: Encryption and authentication testing

### Coverage Requirements

- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 75% minimum
- **Statements**: 80% minimum

### Performance Thresholds

- **Render time**: < 16ms (60fps)
- **Animation frame rate**: > 55fps
- **Touch latency**: < 100ms
- **Memory usage**: < 50MB
- **Memory leaks**: < 5MB per test cycle

## Running Tests

### Individual Test Suites

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security
```

### All Tests

```bash
# Run all test suites
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Custom Test Runner

Use the custom test runner for comprehensive testing:

```bash
# Run all tests with quality gates
node scripts/runTests.js

# Run specific test suites
node scripts/runTests.js unit integration

# Skip optional tests
SKIP_OPTIONAL=true node scripts/runTests.js
```

## Test Utilities

### Test Helpers

The `testHelpers.ts` file provides:
- Custom render function with providers
- Mock data generators
- Performance measurement utilities
- Security testing utilities

### Test Configuration

The `testConfig.ts` file contains:
- Performance thresholds
- Security settings
- Test data limits
- Mock configurations

### Mock Data

Mock data generators create realistic test data:
- Users (adult and child)
- Savings goals
- Expenses and income
- Farm and crop data

## Quality Gates

The testing pipeline includes quality gates that must pass:

1. **Coverage Gate**: Minimum 80% line coverage
2. **Performance Gate**: All performance thresholds met
3. **Security Gate**: All security tests pass
4. **Build Gate**: Application builds successfully

## Continuous Integration

The CI pipeline runs:
1. Linting and type checking
2. All test suites in parallel
3. Security scanning
4. Performance benchmarking
5. Quality gate validation

### GitHub Actions Workflow

The `.github/workflows/ci.yml` file defines:
- Multi-node version testing
- Parallel test execution
- Artifact collection
- Quality reporting

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive names**: Use clear test descriptions
3. **Single responsibility**: One assertion per test
4. **Mock external dependencies**: Isolate units under test
5. **Clean up**: Properly dispose of resources

### Performance Testing

1. **Measure consistently**: Use performance.now() for timing
2. **Account for variance**: Run multiple iterations
3. **Test on target devices**: Use realistic hardware specs
4. **Monitor memory**: Check for leaks and excessive usage

### Security Testing

1. **Test edge cases**: Invalid inputs, boundary conditions
2. **Verify encryption**: Ensure data is properly encrypted
3. **Check authorization**: Verify access controls
4. **Validate inputs**: Test input sanitization

## Debugging Tests

### Common Issues

1. **Async operations**: Use proper async/await patterns
2. **Timer mocking**: Mock timers for time-dependent tests
3. **Component cleanup**: Unmount components properly
4. **Memory leaks**: Clear intervals and event listeners

### Debugging Tools

- Jest debugger integration
- React DevTools for component testing
- Performance profiler for optimization
- Network inspector for API testing

## Maintenance

### Regular Tasks

1. **Update snapshots**: When UI changes are intentional
2. **Review coverage**: Identify untested code paths
3. **Performance monitoring**: Track performance regressions
4. **Security updates**: Keep security tests current

### Test Data Management

1. **Keep mocks updated**: Sync with real API changes
2. **Realistic data**: Use representative test data
3. **Data cleanup**: Remove obsolete test data
4. **Version control**: Track test data changes

## Reporting

### Test Reports

Generated reports include:
- Coverage reports (HTML, LCOV)
- Test results (JUnit XML)
- Performance benchmarks (JSON)
- Security scan results

### Metrics Tracking

Key metrics monitored:
- Test execution time
- Coverage trends
- Performance benchmarks
- Security vulnerability counts

## Troubleshooting

### Common Problems

1. **Tests timing out**: Increase timeout or optimize tests
2. **Memory issues**: Check for leaks and excessive usage
3. **Flaky tests**: Identify and fix non-deterministic behavior
4. **CI failures**: Check environment differences

### Getting Help

1. Check test logs for detailed error messages
2. Review test configuration for environment issues
3. Consult documentation for testing library usage
4. Use debugging tools to investigate failures

## Future Improvements

Planned enhancements:
1. Visual regression testing
2. Accessibility testing automation
3. Load testing for concurrent users
4. Cross-platform testing automation
5. AI-powered test generation
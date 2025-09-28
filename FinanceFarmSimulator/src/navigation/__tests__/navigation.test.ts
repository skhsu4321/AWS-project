// Simple test to verify navigation structure
describe('Navigation Structure', () => {
  it('should have navigation components defined', () => {
    // Import navigation components to verify they compile
    const AppNavigator = require('../AppNavigator').AppNavigator;
    const AuthNavigator = require('../AuthNavigator').AuthNavigator;
    const MainNavigator = require('../MainNavigator').MainNavigator;
    
    expect(AppNavigator).toBeDefined();
    expect(AuthNavigator).toBeDefined();
    expect(MainNavigator).toBeDefined();
  });
});
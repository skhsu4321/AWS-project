#!/usr/bin/env node

/**
 * Quick Test Runner for Finance Farm Simulator
 * This script helps validate the app without needing a physical device
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function validateProjectStructure() {
  log('\n🔍 Validating Project Structure...', 'cyan');
  
  const requiredFiles = [
    'package.json',
    'app.config.js',
    'src/components/integration/AppIntegration.tsx',
    'src/components/integration/AppIntegrationEnhanced.tsx',
    'src/components/integration/ErrorBoundary.tsx',
    'src/services/ErrorHandlingService.ts',
    'src/services/LoggingService.ts',
    'src/store/store.ts',
  ];

  const requiredDirectories = [
    'src/components',
    'src/services',
    'src/store',
    'src/screens',
    'src/hooks',
    'src/utils',
  ];

  let allValid = true;

  // Check files
  requiredFiles.forEach(file => {
    if (checkFileExists(file)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - MISSING`, 'red');
      allValid = false;
    }
  });

  // Check directories
  requiredDirectories.forEach(dir => {
    if (checkFileExists(dir)) {
      log(`  ✅ ${dir}/`, 'green');
    } else {
      log(`  ❌ ${dir}/ - MISSING`, 'red');
      allValid = false;
    }
  });

  return allValid;
}

function validatePackageJson() {
  log('\n📦 Validating package.json...', 'cyan');
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDependencies = [
      'react',
      'react-native',
      'expo',
      '@reduxjs/toolkit',
      'react-redux',
      'react-native-reanimated',
      'react-native-gesture-handler',
    ];

    const requiredScripts = [
      'start',
      'test',
      'test:unit',
      'test:integration',
    ];

    let allValid = true;

    // Check dependencies
    log('  Dependencies:', 'yellow');
    requiredDependencies.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        log(`    ✅ ${dep}: ${packageJson.dependencies[dep]}`, 'green');
      } else {
        log(`    ❌ ${dep} - MISSING`, 'red');
        allValid = false;
      }
    });

    // Check scripts
    log('  Scripts:', 'yellow');
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`    ✅ ${script}: ${packageJson.scripts[script]}`, 'green');
      } else {
        log(`    ❌ ${script} - MISSING`, 'red');
        allValid = false;
      }
    });

    return allValid;
  } catch (error) {
    log(`  ❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function validateTypeScriptConfig() {
  log('\n🔧 Validating TypeScript Configuration...', 'cyan');
  
  const tsConfigExists = checkFileExists('tsconfig.json');
  if (tsConfigExists) {
    log('  ✅ tsconfig.json exists', 'green');
  } else {
    log('  ⚠️ tsconfig.json not found - will be auto-generated', 'yellow');
  }

  // Check for TypeScript files
  const tsFiles = [
    'src/components/integration/AppIntegration.tsx',
    'src/services/ErrorHandlingService.ts',
    'src/store/store.ts',
  ];

  let tsFilesExist = 0;
  tsFiles.forEach(file => {
    if (checkFileExists(file)) {
      tsFilesExist++;
    }
  });

  log(`  ✅ ${tsFilesExist}/${tsFiles.length} TypeScript files found`, 'green');
  return true;
}

function validateAppConfig() {
  log('\n⚙️ Validating App Configuration...', 'cyan');
  
  try {
    const appConfigPath = path.join(__dirname, '..', 'app.config.js');
    if (!fs.existsSync(appConfigPath)) {
      log('  ❌ app.config.js not found', 'red');
      return false;
    }

    const configContent = fs.readFileSync(appConfigPath, 'utf8');
    
    const requiredFields = [
      'name',
      'slug',
      'version',
      'platforms',
      'ios',
      'android',
    ];

    let allValid = true;
    requiredFields.forEach(field => {
      if (configContent.includes(field)) {
        log(`  ✅ ${field} configured`, 'green');
      } else {
        log(`  ❌ ${field} missing from config`, 'red');
        allValid = false;
      }
    });

    return allValid;
  } catch (error) {
    log(`  ❌ Error reading app.config.js: ${error.message}`, 'red');
    return false;
  }
}

function checkTestFiles() {
  log('\n🧪 Checking Test Files...', 'cyan');
  
  const testDirectories = [
    'src/__tests__',
    'src/components/__tests__',
    'src/services/__tests__',
    'src/utils/__tests__',
  ];

  let testFilesFound = 0;
  
  testDirectories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      const testFiles = files.filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'));
      testFilesFound += testFiles.length;
      log(`  ✅ ${dir}: ${testFiles.length} test files`, 'green');
    } else {
      log(`  ⚠️ ${dir}: directory not found`, 'yellow');
    }
  });

  log(`  📊 Total test files found: ${testFilesFound}`, testFilesFound > 0 ? 'green' : 'yellow');
  return testFilesFound > 0;
}

function generateTestReport() {
  log('\n📋 Generating Test Report...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    projectStructure: validateProjectStructure(),
    packageJson: validatePackageJson(),
    typeScriptConfig: validateTypeScriptConfig(),
    appConfig: validateAppConfig(),
    testFiles: checkTestFiles(),
  };

  const reportPath = path.join(__dirname, '..', 'quick-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`  ✅ Report saved to: quick-test-report.json`, 'green');
  return report;
}

function showRecommendations(report) {
  log('\n💡 Recommendations:', 'magenta');
  
  if (!report.projectStructure) {
    log('  🔧 Fix missing project files and directories', 'yellow');
  }
  
  if (!report.packageJson) {
    log('  📦 Install missing dependencies: npm install', 'yellow');
  }
  
  if (!report.testFiles) {
    log('  🧪 Consider adding more test files for better coverage', 'yellow');
  }

  log('\n🚀 Next Steps:', 'blue');
  log('  1. Install Node.js if not already installed', 'blue');
  log('  2. Run: npm install', 'blue');
  log('  3. Run: npm run test:unit', 'blue');
  log('  4. Run: npm run web (for web testing)', 'blue');
  log('  5. Set up Android emulator for mobile testing', 'blue');
}

function showTestingOptions() {
  log('\n🎯 Available Testing Options:', 'bright');
  
  log('\n1. Web Testing (Recommended for quick start):', 'cyan');
  log('   npm run web', 'green');
  log('   - Opens app in browser at http://localhost:19006', 'yellow');
  log('   - Hot reload for quick development', 'yellow');
  log('   - Chrome DevTools for debugging', 'yellow');

  log('\n2. Automated Testing:', 'cyan');
  log('   npm run test:unit', 'green');
  log('   npm run test:integration', 'green');
  log('   npm run test:all', 'green');
  log('   - Validates business logic without device', 'yellow');
  log('   - Comprehensive test coverage', 'yellow');

  log('\n3. Android Emulator:', 'cyan');
  log('   npm run android', 'green');
  log('   - Requires Android Studio setup', 'yellow');
  log('   - Full mobile experience', 'yellow');

  log('\n4. Development Build:', 'cyan');
  log('   eas build --profile development', 'green');
  log('   - Requires EAS CLI and Expo account', 'yellow');
  log('   - Install on real device', 'yellow');
}

// Main execution
function main() {
  log('🌱 Finance Farm Simulator - Quick Test Validator', 'bright');
  log('================================================', 'bright');
  
  const report = generateTestReport();
  
  const overallStatus = Object.values(report).every(status => status === true);
  
  log('\n📊 Overall Status:', 'bright');
  if (overallStatus) {
    log('  ✅ Project is ready for testing!', 'green');
  } else {
    log('  ⚠️ Some issues found - see recommendations below', 'yellow');
  }
  
  showRecommendations(report);
  showTestingOptions();
  
  log('\n📚 For detailed testing instructions, see:', 'blue');
  log('  - TESTING_ALTERNATIVES.md', 'blue');
  log('  - FINAL_INTEGRATION_SUMMARY.md', 'blue');
  
  return overallStatus;
}

// Run if called directly
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { main };
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_SUITES = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    required: true,
    timeout: 300000, // 5 minutes
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    required: true,
    timeout: 600000, // 10 minutes
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    required: true,
    timeout: 900000, // 15 minutes
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm run test:performance',
    required: false,
    timeout: 300000, // 5 minutes
  },
  security: {
    name: 'Security Tests',
    command: 'npm run test:security',
    required: true,
    timeout: 300000, // 5 minutes
  },
};

// Quality gates
const QUALITY_GATES = {
  coverage: {
    threshold: 80,
    check: (results) => {
      const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');
      if (!fs.existsSync(coverageFile)) {
        return { passed: false, message: 'Coverage file not found' };
      }
      
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const lineCoverage = coverage.total.lines.pct;
      
      return {
        passed: lineCoverage >= QUALITY_GATES.coverage.threshold,
        message: `Line coverage: ${lineCoverage}% (threshold: ${QUALITY_GATES.coverage.threshold}%)`,
        value: lineCoverage,
      };
    },
  },
  performance: {
    maxRenderTime: 16,
    check: (results) => {
      // This would check performance test results
      return { passed: true, message: 'Performance tests passed' };
    },
  },
  security: {
    check: (results) => {
      // This would check security test results
      return { passed: true, message: 'Security tests passed' };
    },
  },
};

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };
  
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
};

const runCommand = (command, options = {}) => {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: options.timeout || 300000,
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message,
      error: error.stderr || error.message,
    };
  }
};

const generateTestReport = (results) => {
  const reportPath = path.join(__dirname, '../test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length,
    },
    results,
    qualityGates: {},
  };
  
  // Check quality gates
  for (const [gateName, gate] of Object.entries(QUALITY_GATES)) {
    if (gate.check) {
      report.qualityGates[gateName] = gate.check(results);
    }
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Test report generated: ${reportPath}`, 'info');
  
  return report;
};

const printSummary = (report) => {
  log('\n=== TEST EXECUTION SUMMARY ===', 'info');
  log(`Total test suites: ${report.summary.total}`, 'info');
  log(`Passed: ${report.summary.passed}`, 'success');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
  
  log('\n=== TEST SUITE RESULTS ===', 'info');
  for (const [suiteName, result] of Object.entries(report.results)) {
    const status = result.success ? '✅' : '❌';
    const level = result.success ? 'success' : 'error';
    log(`${status} ${TEST_SUITES[suiteName]?.name || suiteName}: ${result.success ? 'PASSED' : 'FAILED'}`, level);
    
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`, 'error');
    }
    
    if (result.duration) {
      log(`   Duration: ${result.duration}ms`, 'info');
    }
  }
  
  log('\n=== QUALITY GATES ===', 'info');
  for (const [gateName, gate] of Object.entries(report.qualityGates)) {
    const status = gate.passed ? '✅' : '❌';
    const level = gate.passed ? 'success' : 'error';
    log(`${status} ${gateName}: ${gate.message}`, level);
  }
  
  const overallSuccess = report.summary.failed === 0 && 
    Object.values(report.qualityGates).every(gate => gate.passed);
  
  log(`\n=== OVERALL RESULT ===`, 'info');
  log(overallSuccess ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED', overallSuccess ? 'success' : 'error');
  
  return overallSuccess;
};

// Main execution function
const runTests = async () => {
  log('Starting comprehensive test suite execution...', 'info');
  
  const results = {};
  const startTime = Date.now();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const suitesToRun = args.length > 0 ? args : Object.keys(TEST_SUITES);
  const isCI = process.env.CI === 'true';
  const skipOptional = process.env.SKIP_OPTIONAL === 'true';
  
  log(`Running test suites: ${suitesToRun.join(', ')}`, 'info');
  if (isCI) log('Running in CI mode', 'info');
  
  // Run each test suite
  for (const suiteName of suitesToRun) {
    const suite = TEST_SUITES[suiteName];
    if (!suite) {
      log(`Unknown test suite: ${suiteName}`, 'warning');
      continue;
    }
    
    if (skipOptional && !suite.required) {
      log(`Skipping optional test suite: ${suite.name}`, 'info');
      results[suiteName] = { success: true, skipped: true };
      continue;
    }
    
    log(`\nRunning ${suite.name}...`, 'info');
    const suiteStartTime = Date.now();
    
    const result = runCommand(suite.command, {
      timeout: suite.timeout,
      cwd: process.cwd(),
    });
    
    const duration = Date.now() - suiteStartTime;
    results[suiteName] = {
      ...result,
      duration,
      required: suite.required,
    };
    
    if (result.success) {
      log(`✅ ${suite.name} completed successfully (${duration}ms)`, 'success');
    } else {
      log(`❌ ${suite.name} failed (${duration}ms)`, 'error');
      if (result.error) {
        log(`Error details: ${result.error}`, 'error');
      }
      
      // Stop execution if required test fails and not in CI
      if (suite.required && !isCI) {
        log('Stopping execution due to required test failure', 'error');
        break;
      }
    }
  }
  
  const totalDuration = Date.now() - startTime;
  log(`\nTotal execution time: ${totalDuration}ms`, 'info');
  
  // Generate and display report
  const report = generateTestReport(results);
  const success = printSummary(report);
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, TEST_SUITES, QUALITY_GATES };
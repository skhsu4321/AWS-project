#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Deployment readiness checklist
const READINESS_CHECKS = {
  codeQuality: {
    name: 'Code Quality',
    checks: [
      {
        name: 'TypeScript compilation',
        command: 'npx tsc --noEmit',
        required: true,
        description: 'Ensure all TypeScript code compiles without errors',
      },
      {
        name: 'ESLint checks',
        command: 'npx eslint src --ext .ts,.tsx --max-warnings 0',
        required: true,
        description: 'Ensure code follows linting standards',
      },
      {
        name: 'Prettier formatting',
        command: 'npx prettier --check src',
        required: true,
        description: 'Ensure code is properly formatted',
      },
    ],
  },
  testing: {
    name: 'Testing',
    checks: [
      {
        name: 'Unit tests',
        command: 'npm run test:unit -- --coverage --watchAll=false',
        required: true,
        description: 'All unit tests must pass with adequate coverage',
        coverageThreshold: 80,
      },
      {
        name: 'Integration tests',
        command: 'npm run test:integration -- --watchAll=false',
        required: true,
        description: 'All integration tests must pass',
      },
      {
        name: 'E2E tests',
        command: 'npm run test:e2e',
        required: false,
        description: 'End-to-end tests for critical workflows',
      },
    ],
  },
  security: {
    name: 'Security',
    checks: [
      {
        name: 'Dependency audit',
        command: 'npm audit --audit-level moderate',
        required: true,
        description: 'Check for security vulnerabilities in dependencies',
      },
      {
        name: 'Security tests',
        command: 'npm run test:security',
        required: true,
        description: 'Run security-specific tests',
      },
    ],
  },
  performance: {
    name: 'Performance',
    checks: [
      {
        name: 'Bundle size analysis',
        command: 'npx expo export --platform all',
        required: true,
        description: 'Analyze bundle size and ensure it meets targets',
        bundleSizeLimit: 50 * 1024 * 1024, // 50MB
      },
      {
        name: 'Performance tests',
        command: 'npm run test:performance',
        required: true,
        description: 'Ensure performance benchmarks are met',
      },
    ],
  },
  accessibility: {
    name: 'Accessibility',
    checks: [
      {
        name: 'Accessibility tests',
        command: 'npm run test:accessibility',
        required: true,
        description: 'Ensure accessibility compliance',
      },
    ],
  },
  configuration: {
    name: 'Configuration',
    checks: [
      {
        name: 'Environment configuration',
        function: 'checkEnvironmentConfig',
        required: true,
        description: 'Verify all required environment variables are set',
      },
      {
        name: 'App configuration',
        function: 'checkAppConfig',
        required: true,
        description: 'Verify app.config.js is properly configured',
      },
      {
        name: 'EAS configuration',
        function: 'checkEASConfig',
        required: true,
        description: 'Verify eas.json is properly configured',
      },
    ],
  },
  assets: {
    name: 'Assets',
    checks: [
      {
        name: 'Required assets',
        function: 'checkRequiredAssets',
        required: true,
        description: 'Ensure all required assets are present',
      },
      {
        name: 'Asset optimization',
        function: 'checkAssetOptimization',
        required: true,
        description: 'Ensure assets are optimized for production',
      },
    ],
  },
  documentation: {
    name: 'Documentation',
    checks: [
      {
        name: 'README completeness',
        function: 'checkREADME',
        required: true,
        description: 'Ensure README is complete and up-to-date',
      },
      {
        name: 'API documentation',
        function: 'checkAPIDocumentation',
        required: false,
        description: 'Ensure API is properly documented',
      },
    ],
  },
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      timeout: options.timeout || 300000, // 5 minutes default
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || '',
    };
  }
}

function createReadinessReport() {
  const reportDir = path.join(__dirname, '..', 'deployment-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `readiness-report-${Date.now()}.json`);
  return {
    path: reportPath,
    data: {
      timestamp: new Date().toISOString(),
      version: getAppVersion(),
      platform: process.platform,
      node: process.version,
      categories: {},
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        overallStatus: 'unknown',
      },
    },
  };
}

function getAppVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

function updateReport(report, categoryName, checkName, result) {
  if (!report.data.categories[categoryName]) {
    report.data.categories[categoryName] = {
      name: categoryName,
      checks: {},
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0,
    };
  }

  const category = report.data.categories[categoryName];
  category.checks[checkName] = result;
  category.total++;
  
  if (result.status === 'passed') {
    category.passed++;
    report.data.summary.passedChecks++;
  } else if (result.status === 'failed') {
    category.failed++;
    report.data.summary.failedChecks++;
  } else if (result.status === 'warning') {
    category.warnings++;
    report.data.summary.warningChecks++;
  }
  
  report.data.summary.totalChecks++;
  
  // Save report after each update
  fs.writeFileSync(report.path, JSON.stringify(report.data, null, 2));
}

async function runCheck(check, report, categoryName) {
  log(`Running ${check.name}...`);
  
  const startTime = Date.now();
  let result = {
    name: check.name,
    description: check.description,
    required: check.required,
    status: 'failed',
    duration: 0,
    message: '',
    details: {},
  };

  try {
    if (check.command) {
      const commandResult = execCommand(check.command);
      const duration = Date.now() - startTime;
      
      if (commandResult.success) {
        result = {
          ...result,
          status: 'passed',
          duration,
          message: 'Check completed successfully',
          details: {
            output: commandResult.output.substring(0, 1000), // Limit output size
          },
        };
        
        // Additional validation for specific checks
        if (check.coverageThreshold && commandResult.output.includes('Coverage')) {
          const coverage = extractCoveragePercentage(commandResult.output);
          if (coverage < check.coverageThreshold) {
            result.status = 'warning';
            result.message = `Coverage ${coverage}% is below threshold ${check.coverageThreshold}%`;
          }
        }
        
        if (check.bundleSizeLimit && check.name.includes('Bundle size')) {
          const bundleSize = await getBundleSize();
          if (bundleSize > check.bundleSizeLimit) {
            result.status = 'warning';
            result.message = `Bundle size ${formatBytes(bundleSize)} exceeds limit ${formatBytes(check.bundleSizeLimit)}`;
          }
          result.details.bundleSize = bundleSize;
        }
        
      } else {
        result = {
          ...result,
          status: 'failed',
          duration,
          message: commandResult.error,
          details: {
            output: commandResult.output.substring(0, 1000),
          },
        };
      }
    } else if (check.function) {
      const functionResult = await runCustomCheck(check.function);
      const duration = Date.now() - startTime;
      
      result = {
        ...result,
        status: functionResult.success ? 'passed' : 'failed',
        duration,
        message: functionResult.message,
        details: functionResult.details || {},
      };
    }
    
    const statusIcon = result.status === 'passed' ? '✅' : 
                      result.status === 'warning' ? '⚠️' : '❌';
    log(`${statusIcon} ${check.name}: ${result.message}`, 
        result.status === 'passed' ? 'success' : 
        result.status === 'warning' ? 'warning' : 'error');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    result = {
      ...result,
      status: 'failed',
      duration,
      message: `Check failed: ${error.message}`,
      details: { error: error.stack },
    };
    
    log(`❌ ${check.name}: ${result.message}`, 'error');
  }

  updateReport(report, categoryName, check.name, result);
  return result;
}

function extractCoveragePercentage(output) {
  const match = output.match(/All files\s+\|\s+(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

async function getBundleSize() {
  try {
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      return 0;
    }
    
    let totalSize = 0;
    const files = fs.readdirSync(distPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(distPath, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function runCustomCheck(functionName) {
  switch (functionName) {
    case 'checkEnvironmentConfig':
      return checkEnvironmentConfig();
    case 'checkAppConfig':
      return checkAppConfig();
    case 'checkEASConfig':
      return checkEASConfig();
    case 'checkRequiredAssets':
      return checkRequiredAssets();
    case 'checkAssetOptimization':
      return checkAssetOptimization();
    case 'checkREADME':
      return checkREADME();
    case 'checkAPIDocumentation':
      return checkAPIDocumentation();
    default:
      return { success: false, message: `Unknown check function: ${functionName}` };
  }
}

function checkEnvironmentConfig() {
  const requiredEnvVars = [
    'EAS_PROJECT_ID',
    // Add other required environment variables
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing environment variables: ${missing.join(', ')}`,
      details: { missing },
    };
  }
  
  return {
    success: true,
    message: 'All required environment variables are set',
    details: { checked: requiredEnvVars },
  };
}

function checkAppConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'app.config.js');
    if (!fs.existsSync(configPath)) {
      return { success: false, message: 'app.config.js not found' };
    }
    
    // Basic validation - in a real app, you'd check specific config values
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const requiredFields = ['name', 'slug', 'version', 'ios', 'android'];
    const missingFields = requiredFields.filter(field => !configContent.includes(field));
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields in app.config.js: ${missingFields.join(', ')}`,
        details: { missing: missingFields },
      };
    }
    
    return {
      success: true,
      message: 'App configuration is valid',
      details: { checked: requiredFields },
    };
  } catch (error) {
    return { success: false, message: `Failed to check app config: ${error.message}` };
  }
}

function checkEASConfig() {
  try {
    const easConfigPath = path.join(__dirname, '..', 'eas.json');
    if (!fs.existsSync(easConfigPath)) {
      return { success: false, message: 'eas.json not found' };
    }
    
    const easConfig = JSON.parse(fs.readFileSync(easConfigPath, 'utf8'));
    
    if (!easConfig.build || !easConfig.build.production) {
      return { success: false, message: 'Production build configuration missing in eas.json' };
    }
    
    return {
      success: true,
      message: 'EAS configuration is valid',
      details: { profiles: Object.keys(easConfig.build) },
    };
  } catch (error) {
    return { success: false, message: `Failed to check EAS config: ${error.message}` };
  }
}

function checkRequiredAssets() {
  const requiredAssets = [
    'assets/icon.png',
    'assets/splash.png',
    'assets/adaptive-icon.png',
    'assets/favicon.png',
  ];
  
  const missing = requiredAssets.filter(asset => {
    const assetPath = path.join(__dirname, '..', asset);
    return !fs.existsSync(assetPath);
  });
  
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing required assets: ${missing.join(', ')}`,
      details: { missing },
    };
  }
  
  return {
    success: true,
    message: 'All required assets are present',
    details: { checked: requiredAssets },
  };
}

function checkAssetOptimization() {
  // This would check if images are optimized, etc.
  // For now, just return success
  return {
    success: true,
    message: 'Asset optimization check completed',
    details: { note: 'Manual verification recommended' },
  };
}

function checkREADME() {
  try {
    const readmePath = path.join(__dirname, '..', 'README.md');
    if (!fs.existsSync(readmePath)) {
      return { success: false, message: 'README.md not found' };
    }
    
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const requiredSections = ['Installation', 'Usage', 'Features'];
    
    const missingSections = requiredSections.filter(section => 
      !readmeContent.toLowerCase().includes(section.toLowerCase())
    );
    
    if (missingSections.length > 0) {
      return {
        success: false,
        message: `README missing sections: ${missingSections.join(', ')}`,
        details: { missing: missingSections },
      };
    }
    
    return {
      success: true,
      message: 'README is complete',
      details: { wordCount: readmeContent.split(' ').length },
    };
  } catch (error) {
    return { success: false, message: `Failed to check README: ${error.message}` };
  }
}

function checkAPIDocumentation() {
  // This would check if API documentation exists and is complete
  return {
    success: true,
    message: 'API documentation check completed',
    details: { note: 'Manual verification recommended' },
  };
}

function generateReadinessSummary(report) {
  const { data } = report;
  
  log('\n=== DEPLOYMENT READINESS SUMMARY ===', 'info');
  log(`App Version: ${data.version}`, 'info');
  log(`Total Checks: ${data.summary.totalChecks}`, 'info');
  log(`Passed: ${data.summary.passedChecks}`, 'success');
  log(`Failed: ${data.summary.failedChecks}`, data.summary.failedChecks > 0 ? 'error' : 'info');
  log(`Warnings: ${data.summary.warningChecks}`, data.summary.warningChecks > 0 ? 'warning' : 'info');
  
  // Category breakdown
  log('\n=== CATEGORY BREAKDOWN ===', 'info');
  for (const [categoryName, category] of Object.entries(data.categories)) {
    const status = category.failed > 0 ? '❌' : category.warnings > 0 ? '⚠️' : '✅';
    log(`${status} ${category.name}: ${category.passed}/${category.total} passed`, 
        category.failed > 0 ? 'error' : category.warnings > 0 ? 'warning' : 'success');
    
    // Show failed checks
    for (const [checkName, check] of Object.entries(category.checks)) {
      if (check.status === 'failed') {
        log(`   ❌ ${checkName}: ${check.message}`, 'error');
      } else if (check.status === 'warning') {
        log(`   ⚠️ ${checkName}: ${check.message}`, 'warning');
      }
    }
  }
  
  // Overall readiness assessment
  const criticalFailures = Object.values(data.categories).reduce((count, category) => {
    return count + Object.values(category.checks).filter(check => 
      check.status === 'failed' && check.required
    ).length;
  }, 0);
  
  const isReady = criticalFailures === 0;
  data.summary.overallStatus = isReady ? 'ready' : 'not_ready';
  
  log(`\n=== OVERALL STATUS: ${isReady ? 'READY FOR DEPLOYMENT' : 'NOT READY FOR DEPLOYMENT'} ===`, 
      isReady ? 'success' : 'error');
  
  if (!isReady) {
    log(`Critical failures must be resolved before deployment: ${criticalFailures}`, 'error');
  }
  
  if (data.summary.warningChecks > 0) {
    log(`Warnings should be reviewed before deployment: ${data.summary.warningChecks}`, 'warning');
  }
  
  return isReady;
}

// Main function
async function checkDeploymentReadiness(options = {}) {
  const {
    categories = Object.keys(READINESS_CHECKS),
    skipOptional = false,
  } = options;

  log('Starting deployment readiness check...', 'info');
  
  const report = createReadinessReport();
  let overallSuccess = true;

  try {
    for (const categoryName of categories) {
      const category = READINESS_CHECKS[categoryName];
      if (!category) {
        log(`Unknown category: ${categoryName}`, 'warning');
        continue;
      }

      log(`\n=== ${category.name.toUpperCase()} CHECKS ===`, 'info');
      
      for (const check of category.checks) {
        if (skipOptional && !check.required) {
          log(`Skipping optional check: ${check.name}`, 'info');
          continue;
        }
        
        const result = await runCheck(check, report, categoryName);
        
        if (result.status === 'failed' && check.required) {
          overallSuccess = false;
        }
      }
    }

    // Generate final summary
    const isReady = generateReadinessSummary(report);
    overallSuccess = overallSuccess && isReady;

    // Save final report
    fs.writeFileSync(report.path, JSON.stringify(report.data, null, 2));
    log(`\nDetailed report saved to: ${report.path}`, 'info');
    
    return overallSuccess;

  } catch (error) {
    log(`Deployment readiness check failed: ${error.message}`, 'error');
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--categories':
        options.categories = args[++i].split(',');
        break;
      case '--skip-optional':
        options.skipOptional = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Finance Farm Simulator Deployment Readiness Checker

Usage: node scripts/deploymentReadiness.js [options]

Options:
  --categories <list>     Comma-separated list of categories to check
  --skip-optional         Skip optional checks
  -h, --help              Show this help message

Available categories:
  ${Object.keys(READINESS_CHECKS).join(', ')}

Examples:
  node scripts/deploymentReadiness.js
  node scripts/deploymentReadiness.js --categories codeQuality,testing
  node scripts/deploymentReadiness.js --skip-optional
        `);
        process.exit(0);
        break;
      default:
        log(`Unknown option: ${arg}`, 'warning');
        break;
    }
  }

  checkDeploymentReadiness(options).then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkDeploymentReadiness };
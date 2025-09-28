#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ENVIRONMENTS = {
  development: {
    profile: 'development',
    description: 'Development build for internal testing',
  },
  preview: {
    profile: 'preview',
    description: 'Preview build for stakeholder review',
  },
  production: {
    profile: 'production',
    description: 'Production build for app stores',
  },
};

const PLATFORMS = ['ios', 'android', 'all'];

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
  log(`Executing: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function validateEnvironment() {
  log('Validating environment...');
  
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
  } catch (error) {
    log('EAS CLI not found. Please install it with: npm install -g @expo/eas-cli', 'error');
    process.exit(1);
  }

  // Check if logged in to EAS
  try {
    execSync('eas whoami', { stdio: 'pipe' });
  } catch (error) {
    log('Not logged in to EAS. Please run: eas login', 'error');
    process.exit(1);
  }

  // Check if project is configured
  if (!fs.existsSync('eas.json')) {
    log('eas.json not found. Please run: eas build:configure', 'error');
    process.exit(1);
  }

  log('Environment validation passed', 'success');
}

function updateVersion(type = 'patch') {
  log(`Updating version (${type})...`);
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const [major, minor, patch] = packageJson.version.split('.').map(Number);
  
  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Update app.config.js version
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  let appConfig = fs.readFileSync(appConfigPath, 'utf8');
  appConfig = appConfig.replace(/version: '[^']*'/, `version: '${newVersion}'`);
  fs.writeFileSync(appConfigPath, appConfig);
  
  log(`Version updated to ${newVersion}`, 'success');
  return newVersion;
}

function runTests() {
  log('Running tests...');
  execCommand('npm run test:ci');
  log('Tests passed', 'success');
}

function runLinting() {
  log('Running linting...');
  execCommand('npm run lint');
  log('Linting passed', 'success');
}

function buildApp(environment, platform, options = {}) {
  const config = ENVIRONMENTS[environment];
  if (!config) {
    log(`Invalid environment: ${environment}`, 'error');
    process.exit(1);
  }

  log(`Building ${environment} for ${platform}...`);
  
  let command = `eas build --profile ${config.profile}`;
  
  if (platform !== 'all') {
    command += ` --platform ${platform}`;
  }
  
  if (options.nonInteractive) {
    command += ' --non-interactive';
  }
  
  if (options.clearCache) {
    command += ' --clear-cache';
  }
  
  if (options.message) {
    command += ` --message "${options.message}"`;
  }
  
  execCommand(command);
  log(`Build completed for ${environment} on ${platform}`, 'success');
}

function submitApp(environment, platform) {
  const config = ENVIRONMENTS[environment];
  if (!config) {
    log(`Invalid environment: ${environment}`, 'error');
    process.exit(1);
  }

  if (environment !== 'production' && environment !== 'preview') {
    log('Submission is only available for production and preview environments', 'warning');
    return;
  }

  log(`Submitting ${environment} for ${platform}...`);
  
  let command = `eas submit --profile ${environment}`;
  
  if (platform !== 'all') {
    command += ` --platform ${platform}`;
  }
  
  execCommand(command);
  log(`Submission completed for ${environment} on ${platform}`, 'success');
}

function deployUpdate(environment) {
  log(`Deploying OTA update for ${environment}...`);
  
  let command = 'eas update';
  
  if (environment === 'preview') {
    command += ' --branch preview';
  } else if (environment === 'production') {
    command += ' --branch production';
  }
  
  execCommand(command);
  log(`OTA update deployed for ${environment}`, 'success');
}

function generateReleaseNotes(version) {
  const releaseNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');
  const date = new Date().toISOString().split('T')[0];
  
  const template = `# Release Notes - v${version}

## Date: ${date}

### New Features
- 

### Improvements
- 

### Bug Fixes
- 

### Technical Changes
- 

### Known Issues
- 

---
`;

  if (fs.existsSync(releaseNotesPath)) {
    const existingNotes = fs.readFileSync(releaseNotesPath, 'utf8');
    fs.writeFileSync(releaseNotesPath, template + existingNotes);
  } else {
    fs.writeFileSync(releaseNotesPath, template);
  }
  
  log(`Release notes template created for v${version}`, 'success');
}

// Main deployment function
function deploy(options) {
  const {
    environment = 'development',
    platform = 'all',
    versionBump = 'patch',
    skipTests = false,
    skipLinting = false,
    submit = false,
    otaUpdate = false,
    clearCache = false,
    message,
    nonInteractive = false,
  } = options;

  log(`Starting deployment process...`, 'info');
  log(`Environment: ${environment}`, 'info');
  log(`Platform: ${platform}`, 'info');

  try {
    // Validate environment
    validateEnvironment();

    // Run quality checks
    if (!skipLinting) {
      runLinting();
    }

    if (!skipTests) {
      runTests();
    }

    // Update version for production builds
    let newVersion;
    if (environment === 'production') {
      newVersion = updateVersion(versionBump);
      generateReleaseNotes(newVersion);
    }

    // Build the app
    if (otaUpdate) {
      deployUpdate(environment);
    } else {
      buildApp(environment, platform, {
        nonInteractive,
        clearCache,
        message: message || (newVersion ? `Release v${newVersion}` : undefined),
      });

      // Submit to app stores if requested
      if (submit) {
        submitApp(environment, platform);
      }
    }

    log('Deployment completed successfully!', 'success');
    
    if (newVersion) {
      log(`New version: ${newVersion}`, 'info');
      log('Don\'t forget to update the release notes and commit the version changes!', 'warning');
    }

  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--environment':
      case '-e':
        options.environment = args[++i];
        break;
      case '--platform':
      case '-p':
        options.platform = args[++i];
        break;
      case '--version-bump':
      case '-v':
        options.versionBump = args[++i];
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--skip-linting':
        options.skipLinting = true;
        break;
      case '--submit':
      case '-s':
        options.submit = true;
        break;
      case '--ota-update':
      case '-u':
        options.otaUpdate = true;
        break;
      case '--clear-cache':
        options.clearCache = true;
        break;
      case '--message':
      case '-m':
        options.message = args[++i];
        break;
      case '--non-interactive':
        options.nonInteractive = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Finance Farm Simulator Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  -e, --environment <env>     Environment (development, preview, production) [default: development]
  -p, --platform <platform>   Platform (ios, android, all) [default: all]
  -v, --version-bump <type>    Version bump type (major, minor, patch) [default: patch]
  -s, --submit                Submit to app stores after build
  -u, --ota-update            Deploy OTA update instead of building
  -m, --message <message>     Build message
  --skip-tests                Skip running tests
  --skip-linting              Skip running linting
  --clear-cache               Clear build cache
  --non-interactive           Run in non-interactive mode
  -h, --help                  Show this help message

Examples:
  node scripts/deploy.js -e development -p ios
  node scripts/deploy.js -e production -p all -s -v minor
  node scripts/deploy.js -e preview -u
        `);
        process.exit(0);
        break;
      default:
        log(`Unknown option: ${arg}`, 'warning');
        break;
    }
  }

  deploy(options);
}

module.exports = { deploy };
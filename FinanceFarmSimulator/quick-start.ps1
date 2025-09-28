# Finance Farm Simulator - Quick Start Script
# PowerShell version for better compatibility

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Finance Farm Simulator - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Go to https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "2. Download and install the LTS version" -ForegroundColor Yellow
    Write-Host "3. Restart your computer" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Node.js is installed" -ForegroundColor Green
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Gray
Write-Host "   npm: $npmVersion" -ForegroundColor Gray
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the FinanceFarmSimulator directory" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take 2-5 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
        Write-Host ""
    }
    catch {
        Write-Host "❌ npm install failed!" -ForegroundColor Red
        Write-Host "Try running: npm cache clean --force" -ForegroundColor Yellow
        Write-Host "Then run this script again" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    Write-Host ""
}

# Show options
Write-Host "🚀 Choose how to start your app:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Web Browser (Recommended for first time)" -ForegroundColor White
Write-Host "2. Run Tests First" -ForegroundColor White
Write-Host "3. Android Emulator (requires Android Studio)" -ForegroundColor White
Write-Host "4. View Interactive Demo" -ForegroundColor White
Write-Host "5. Check Project Status" -ForegroundColor White
Write-Host "6. Open Documentation" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Starting web development server..." -ForegroundColor Cyan
        Write-Host "Your app will open at http://localhost:19006" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        npm run web
    }
    "2" {
        Write-Host ""
        Write-Host "🧪 Running tests..." -ForegroundColor Cyan
        Write-Host ""
        npm run test:unit
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Tests passed! Now starting web server..." -ForegroundColor Green
            npm run web
        }
    }
    "3" {
        Write-Host ""
        Write-Host "📱 Starting Android development..." -ForegroundColor Cyan
        Write-Host "Make sure Android emulator is running first!" -ForegroundColor Yellow
        Write-Host ""
        npm run android
    }
    "4" {
        Write-Host ""
        Write-Host "🎮 Opening interactive demo..." -ForegroundColor Cyan
        if (Test-Path "demo\index.html") {
            Start-Process "demo\index.html"
            Write-Host "Demo opened in your browser!" -ForegroundColor Green
        } else {
            Write-Host "❌ Demo file not found!" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host ""
        Write-Host "📊 Checking project status..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check key files
        $checks = @(
            @{Name="App Integration"; Path="src\components\integration\AppIntegration.tsx"},
            @{Name="Error Handling"; Path="src\services\ErrorHandlingService.ts"},
            @{Name="State Management"; Path="src\store\store.ts"},
            @{Name="App Configuration"; Path="app.config.js"},
            @{Name="Deployment Config"; Path="eas.json"},
            @{Name="Testing Config"; Path="jest.config.js"}
        )
        
        foreach ($check in $checks) {
            if (Test-Path $check.Path) {
                Write-Host "✅ $($check.Name): Found" -ForegroundColor Green
            } else {
                Write-Host "❌ $($check.Name): Missing" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "📁 Project Structure:" -ForegroundColor Cyan
        
        if (Test-Path "src\components") {
            $componentCount = (Get-ChildItem "src\components" -Directory).Count
            Write-Host "   Components: $componentCount folders" -ForegroundColor Gray
        }
        
        if (Test-Path "src\services") {
            $serviceCount = (Get-ChildItem "src\services" -File -Filter "*.ts").Count
            Write-Host "   Services: $serviceCount files" -ForegroundColor Gray
        }
        
        if (Test-Path "src\screens") {
            $screenCount = (Get-ChildItem "src\screens" -Directory).Count
            Write-Host "   Screens: $screenCount folders" -ForegroundColor Gray
        }
        
        if (Test-Path "src\__tests__") {
            $testCount = (Get-ChildItem "src\__tests__" -File -Filter "*.test.*" -Recurse).Count
            Write-Host "   Tests: $testCount files" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "🎯 Your Finance Farm Simulator is ready!" -ForegroundColor Green
        Write-Host "Run this script again to start testing." -ForegroundColor Yellow
    }
    "6" {
        Write-Host ""
        Write-Host "📚 Opening documentation..." -ForegroundColor Cyan
        
        $docs = @(
            "QUICK_START_GUIDE.md",
            "TESTING_ALTERNATIVES.md", 
            "QUICK_VALIDATION.md",
            "FINAL_INTEGRATION_SUMMARY.md"
        )
        
        foreach ($doc in $docs) {
            if (Test-Path $doc) {
                Write-Host "📄 $doc" -ForegroundColor Yellow
                Start-Process $doc
            }
        }
        
        Write-Host "Documentation files opened!" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   - QUICK_START_GUIDE.md" -ForegroundColor Yellow
Write-Host "   - TESTING_ALTERNATIVES.md" -ForegroundColor Yellow
Write-Host "   - QUICK_VALIDATION.md" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
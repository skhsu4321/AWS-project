@echo off
echo.
echo ========================================
echo  Finance Farm Simulator - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download and install the LTS version
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
npm --version
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found!
    echo Please run this script from the FinanceFarmSimulator directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo This may take 2-5 minutes...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install failed!
        echo Try running: npm cache clean --force
        echo Then run this script again
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully!
    echo.
) else (
    echo ✅ Dependencies already installed
    echo.
)

REM Show options
echo 🚀 Choose how to start your app:
echo.
echo 1. Web Browser (Recommended for first time)
echo 2. Run Tests First
echo 3. Android Emulator (requires Android Studio)
echo 4. View Interactive Demo
echo 5. Check Project Status
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🌐 Starting web development server...
    echo Your app will open at http://localhost:19006
    echo Press Ctrl+C to stop the server
    echo.
    npm run web
) else if "%choice%"=="2" (
    echo.
    echo 🧪 Running tests...
    echo.
    npm run test:unit
    if %errorlevel% equ 0 (
        echo.
        echo ✅ Tests passed! Now starting web server...
        npm run web
    )
) else if "%choice%"=="3" (
    echo.
    echo 📱 Starting Android development...
    echo Make sure Android emulator is running first!
    echo.
    npm run android
) else if "%choice%"=="4" (
    echo.
    echo 🎮 Opening interactive demo...
    start demo\index.html
    echo Demo opened in your browser!
) else if "%choice%"=="5" (
    echo.
    echo 📊 Checking project status...
    echo.
    if exist "src\components\integration\AppIntegration.tsx" (
        echo ✅ App Integration: Found
    ) else (
        echo ❌ App Integration: Missing
    )
    
    if exist "src\services\ErrorHandlingService.ts" (
        echo ✅ Error Handling: Found
    ) else (
        echo ❌ Error Handling: Missing
    )
    
    if exist "src\store\store.ts" (
        echo ✅ State Management: Found
    ) else (
        echo ❌ State Management: Missing
    )
    
    if exist "app.config.js" (
        echo ✅ App Configuration: Found
    ) else (
        echo ❌ App Configuration: Missing
    )
    
    echo.
    echo 📁 Project Structure:
    dir /b src\components 2>nul | find /c /v "" > temp.txt
    set /p componentCount=<temp.txt
    del temp.txt
    echo    Components: %componentCount% folders
    
    dir /b src\services 2>nul | find /c /v "" > temp.txt
    set /p serviceCount=<temp.txt
    del temp.txt
    echo    Services: %serviceCount% files
    
    dir /b src\screens 2>nul | find /c /v "" > temp.txt
    set /p screenCount=<temp.txt
    del temp.txt
    echo    Screens: %screenCount% folders
    
    echo.
    echo 🎯 Your Finance Farm Simulator is ready!
    echo Run this script again to start testing.
) else (
    echo Invalid choice. Please run the script again.
)

echo.
echo 📚 For detailed instructions, see:
echo    - QUICK_START_GUIDE.md
echo    - TESTING_ALTERNATIVES.md
echo    - QUICK_VALIDATION.md
echo.
pause
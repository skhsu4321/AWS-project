@echo off
setlocal enabledelayedexpansion
title Finance Farm Simulator - Quick Start
color 0A

echo.
echo ==========================================
echo   Finance Farm Simulator - Quick Start
echo ==========================================
echo.

echo 🎮 Step 1: Opening documentation...
echo.

REM Open documentation files one by one with delays
echo Opening App Overview Guide...
start "" "docs\APP_OVERVIEW_GUIDE.html"
ping 127.0.0.1 -n 3 >nul

echo Opening Setup & Testing Guide...
start "" "docs\SETUP_TESTING_GUIDE.html"
ping 127.0.0.1 -n 3 >nul

echo Opening Interactive Demo...
start "" "demo\index.html"
ping 127.0.0.1 -n 2 >nul

echo.
echo ✅ Documentation opened in your browser!
echo.

echo 🔍 Step 2: Checking Node.js installation...
node --version >nul 2>nul
if !errorlevel! neq 0 (
    echo.
    echo ❌ Node.js is NOT installed!
    echo.
    echo 📥 TO INSTALL NODE.JS:
    echo    1. Go to https://nodejs.org/
    echo    2. Download the LTS version ^(left green button^)
    echo    3. Install and restart your computer
    echo    4. Run this script again
    echo.
    echo 💡 You can still view the documentation that opened!
    echo.
    echo Press any key to exit...
    pause >nul
    goto :end
)

echo ✅ Node.js is installed!
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    Version: !NODE_VERSION!
echo.

echo 🔍 Step 3: Checking project files...
if not exist "package.json" (
    echo ❌ package.json not found!
    echo.
    echo Please make sure you are running this script from the
    echo FinanceFarmSimulator folder.
    echo.
    echo Current directory: %CD%
    echo.
    echo Press any key to exit...
    pause >nul
    goto :end
)

echo ✅ Found package.json
echo.

echo 🔍 Step 4: Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo This will take 2-5 minutes, please be patient...
    echo.
    
    echo Running: npm install --legacy-peer-deps
    npm install --legacy-peer-deps
    
    if !errorlevel! neq 0 (
        echo.
        echo ❌ Installation failed!
        echo.
        echo Try these solutions:
        echo    1. npm cache clean --force
        echo    2. Delete node_modules folder if it exists
        echo    3. Run this script again
        echo.
        echo Press any key to exit...
        pause >nul
        goto :end
    )
    
    echo.
    echo ✅ Dependencies installed successfully!
    echo.
) else (
    echo ✅ Dependencies already installed
    echo.
)

echo 🚀 Step 5: Starting the Finance Farm Simulator...
echo.
echo The app will open at: http://localhost:8081
echo.
echo ⏳ Please wait 30-60 seconds for the app to load...
echo    ^(The first time may take longer^)
echo.
echo 💡 What you can do while waiting:
echo    - Check the documentation that opened
echo    - The app will automatically open in your browser
echo.
echo 🛑 To stop the server: Press Ctrl+C
echo.

REM Start the web server
npm run web

:end
echo.
echo 👋 Thanks for testing Finance Farm Simulator!
echo.
echo Press any key to close this window...
pause >nul
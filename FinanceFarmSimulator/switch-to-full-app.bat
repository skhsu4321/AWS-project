@echo off
echo 🚀 Switching to Full Function App...
echo.

REM Backup current version
if exist App.tsx (
    echo 📁 Backing up current App.tsx to App-Demo.tsx...
    copy App.tsx App-Demo.tsx >nul
    echo ✅ Backup created
) else (
    echo ⚠️  App.tsx not found
)

REM Switch to full app
if exist App-Full.tsx (
    echo 🔄 Switching to full app version...
    copy App-Full.tsx App.tsx >nul
    echo ✅ Switched to full app!
) else (
    echo ❌ App-Full.tsx not found
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! You're now using the FULL FUNCTION APP
echo.
echo 📋 What you now have:
echo    ✅ Real login/registration forms
echo    ✅ Complete navigation (6 screens)
echo    ✅ Functional input fields
echo    ✅ Data persistence
echo    ✅ Interactive farm visualization
echo.
echo 🚀 Next steps:
echo    1. Start Android emulator in Android Studio
echo    2. Run: npm run android
echo    3. Test the full features!
echo.
pause
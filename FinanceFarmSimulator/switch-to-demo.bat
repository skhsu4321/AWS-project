@echo off
echo 🔄 Switching back to Demo version...
echo.

REM Switch back to demo
if exist App-Demo.tsx (
    echo 📱 Switching to demo version...
    copy App-Demo.tsx App.tsx >nul
    echo ✅ Switched to demo version!
) else (
    echo ❌ App-Demo.tsx not found
    echo Creating demo version...
    
    REM Create a simple demo if backup doesn't exist
    echo import React from 'react'; > App.tsx
    echo import { View, Text } from 'react-native'; >> App.tsx
    echo export default function App() { >> App.tsx
    echo   return ^<View^>^<Text^>Demo App^</Text^>^</View^>; >> App.tsx
    echo } >> App.tsx
)

echo.
echo 📱 You're now using the DEMO version
echo    - Simple button interface
echo    - Alert popups for testing
echo    - Works in web browser
echo.
pause
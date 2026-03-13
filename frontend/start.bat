@echo off
cls
echo ================================================
echo   SafeSign ICU Monitoring - Frontend Setup
echo ================================================
echo.

cd /d "%~dp0"

if exist node_modules (
    echo [OK] Dependencies already installed
) else (
    echo [STEP] Installing dependencies...
    npm install
    echo.
)

echo.
echo [INFO] Starting development server...
echo [INFO] Access at: http://localhost:3000
echo [INFO] Backend must run at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev


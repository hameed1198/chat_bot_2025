@echo off
echo Starting MediCare AI - Full Stack Application
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Backend (Python API)...
start "MediCare Backend" cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend (React)...
start "MediCare Frontend" cmd /c "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo MediCare AI is starting up!
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: http://localhost:3000
echo.
echo Both applications are starting in separate windows.
echo Close this window when you're done.
echo ========================================
echo.

pause

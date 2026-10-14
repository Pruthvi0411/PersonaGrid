@echo off
setlocal enabledelayedexpansion
title PersonaGrid - Local Launcher
cd /d "%~dp0"

echo =====================================================================
echo    PersonaGrid - Synthetic Identity Leasing Marketplace
echo    Local Launcher (Offline / Standalone Execution)
echo =====================================================================
echo.

:: 1. Pre-flight Check: Node.js & npm
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js ^(v18 or higher^) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Pre-flight Check: Python (for optional backend services)
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set HAS_PYTHON=1
) else (
    set HAS_PYTHON=0
)

:: 3. Pre-flight Check: Dependencies
if not exist "node_modules\" (
    echo [*] First-time setup detected: Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
    echo [*] Dependencies successfully installed.
    echo.
)

:: 4. Environment Check
if not exist ".env" (
    echo [*] Generating default local .env file...
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personagrid > .env
    echo PORT=8000 >> .env
    echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> .env
)

echo Select launch mode:
echo   [1] Launch PersonaGrid Website (Next.js - http://localhost:3000)
echo   [2] Launch Full Stack (FastAPI Backend + Next.js Website)
echo   [3] Build Production Bundle and Serve
echo.
echo Press 1, 2, or 3 (Automatically launches Website [1] in 5 seconds)...
choice /c 123 /t 5 /d 1 /n /m "Selection [1]: "
set LAUNCH_MODE=%ERRORLEVEL%

if "%LAUNCH_MODE%"=="1" goto START_DEV_WEBSITE
if "%LAUNCH_MODE%"=="2" goto START_FULLSTACK
if "%LAUNCH_MODE%"=="3" goto START_PROD_WEBSITE

:START_DEV_WEBSITE
echo.
echo =====================================================================
echo [*] Starting Next.js Dev Server on http://localhost:3000...
echo [*] Opening default web browser in 3 seconds...
echo =====================================================================
if exist ".next\server\pages" rd /s /q ".next\server\pages" >nul 2>&1
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run dev
goto EXIT_SCRIPT

:START_FULLSTACK
echo.
echo =====================================================================
echo [*] Launching Full-Stack PersonaGrid...
echo =====================================================================
if "%HAS_PYTHON%"=="1" (
    echo [*] Starting FastAPI Backend on http://localhost:8000 in background...
    start "PersonaGrid Backend (FastAPI)" cmd /k "title PersonaGrid Backend && cd /d \"%~dp0\" && python main.py"
) else (
    echo [!] Python not found; skipping local FastAPI daemon.
)
if exist ".next\server\pages" rd /s /q ".next\server\pages" >nul 2>&1
echo [*] Starting Next.js Dev Server on http://localhost:3000...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run dev
goto EXIT_SCRIPT

:START_PROD_WEBSITE
echo.
echo =====================================================================
echo [*] Creating optimized Next.js 15 production build...
echo =====================================================================
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [*] Serving production build on http://localhost:3000...
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"
    call npm run start
) else (
    echo [ERROR] Production build failed.
    pause
)
goto EXIT_SCRIPT

:EXIT_SCRIPT
echo.
echo [*] Server process terminated.
pause

@echo off
echo Starting Classroom Utilization System...
echo.

REM Kill any existing Node processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

echo Starting the system in production mode...
echo This will build React and start the server on port 5000
echo.
echo Access your system at: http://localhost:5000
echo Login with: test@example.com / password123
echo.

REM Start the system
npm run build:server

pause

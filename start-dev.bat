@echo off
echo Starting Classroom Utilization System in Development Mode...
echo.

REM Kill any existing Node processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

echo Starting development servers...
echo React will run on: http://localhost:3000
echo API will run on: http://localhost:5000
echo Login with: test@example.com / password123
echo.

REM Start the development servers
npm run dev

pause

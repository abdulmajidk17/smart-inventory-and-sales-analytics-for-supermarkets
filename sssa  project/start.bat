@echo off
echo ========================================
echo  SSSA - Smart Sales & Stock Analytics
echo  Quick Start Script
echo ========================================
echo.

echo Starting Backend Server...
start "SSSA Backend" cmd /k "call venv\Scripts\activate && python app.py"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "SSSA Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo  Both servers are starting...
echo  Backend: http://127.0.0.1:5000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Login with:
echo Username: admin
echo Password: admin
echo.
pause


@echo off
echo ========================================
echo   SSSA System - Start Both Servers
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "app.py" (
    echo Error: app.py not found. Please run this from the sssa project directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found.
    pause
    exit /b 1
)

echo Starting SSSA System servers...
echo.

:: Start Backend Server
echo [1/2] Starting Backend Server (Flask)...
echo ----------------------------------------
start "SSSA Backend" cmd /k "echo Starting Flask server... && python app.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo [2/2] Starting Frontend Server (React)...
echo ------------------------------------------
start "SSSA Frontend" cmd /k "cd frontend && echo Starting React server... && npm start"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend (Flask):  http://localhost:5000
echo Frontend (React): http://localhost:3000
echo.
echo Login credentials:
echo Username: admin
echo Password: admin123
echo.
echo INSTRUCTIONS:
echo 1. Wait for both server windows to fully load
echo 2. The React app should open automatically in your browser
echo 3. If not, manually visit http://localhost:3000
echo 4. Navigate to Inventory to test the Add Product feature
echo.
echo To stop the servers:
echo - Close both command windows that opened
echo - Or press Ctrl+C in each window
echo.
echo Press any key to continue...
pause >nul

echo.
echo Testing the Enhanced Add Product Feature:
echo ========================================
echo 1. Go to http://localhost:3000
echo 2. Login with admin/admin123
echo 3. Click "Inventory" in the navigation
echo 4. Click the blue "Add Product" button
echo 5. Try both basic and advanced product creation
echo 6. Test the expandable "Advanced Inventory Settings"
echo 7. Verify supplier dropdown and validation
echo.
echo Happy testing!

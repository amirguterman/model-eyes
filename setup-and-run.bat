@echo off
REM Setup and Run Script for MCP Structured UI

echo Installing dependencies...
call npm install

echo Building the project...
call npm run build

IF %ERRORLEVEL% NEQ 0 (
  echo Build failed. Please check the error messages above.
  exit /b 1
)

echo Build successful!

echo What would you like to run?
echo 1. Web Example (Interactive UI)
echo 2. Demo Script (Command Line)
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
  echo Starting the web example...
  echo The example will be available at http://localhost:1234
  echo Press Ctrl+C to stop the server when you're done.
  call npx parcel examples/web-example.html
) else if "%choice%"=="2" (
  echo Running the demonstration script...
  node examples/demo.js
) else (
  echo Invalid choice. Exiting.
  exit /b 1
)
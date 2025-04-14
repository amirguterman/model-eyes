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

echo Starting the web example...
echo The example will be available at http://localhost:1234
echo Press Ctrl+C to stop the server when you're done.
call npx parcel examples/web-example.html
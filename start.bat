@echo off
rem Double-click to run Anatomy Motion. Starts the local server and opens the browser.
rem Close this window (or press Ctrl+C) to stop the server.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on the PATH. Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)
start "" http://localhost:5178
node dev-server.mjs 5178
if errorlevel 1 (
  echo.
  echo The server could not start. If port 5178 is already in use, the app may already be running:
  echo the browser tab that just opened should still work.
  pause
)

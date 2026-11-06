@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ===== SETTINGS - change these =====

rem Secret code that new users must type to register (already random - you may change it).
set INVITE_CODE=GksXgTLUE38LTRAM

rem Your Tailscale address (without https://), after you create the funnel. Example:
rem set ALLOWED_HOSTS=my-pc.tail1234.ts.net
rem set ALLOWED_HOSTS=

rem ===== do not change below =====
set HOST=127.0.0.1
set PORT=8000
set SECURE_COOKIE=1

echo Starting WordMaster server... (close this window to stop it)
where python >nul 2>nul && (python server.py) || (py server.py)
pause

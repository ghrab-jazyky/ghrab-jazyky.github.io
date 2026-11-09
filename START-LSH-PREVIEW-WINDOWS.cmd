@echo off
setlocal
title Language Skills Hub - local acceptance preview
cd /d "%~dp0"

if not exist "language-skills-hub\index.html" (
  echo ERROR: The downloaded preview archive was not extracted completely.
  echo Required folder: language-skills-hub
  pause
  exit /b 1
)

where node >nul 2>&1
if not errorlevel 1 goto :node

where py >nul 2>&1
if not errorlevel 1 goto :python

echo Python or Node.js is required to run this self-contained local preview.
echo The preview is NOT available by double-clicking the HTML file.
echo Install an approved version of Python or Node.js and run this file again.
pause
exit /b 1

:node
echo Starting local preview with Node.js...
echo Browser link: http://127.0.0.1:8765/language-skills-hub/
start "" "http://127.0.0.1:8765/language-skills-hub/"
node "preview-tools\server.cjs"
goto :end

:python
echo Starting local preview with Python (localhost only)...
echo Browser link: http://127.0.0.1:8765/language-skills-hub/
start "" "http://127.0.0.1:8765/language-skills-hub/"
py -3 -m http.server 8765 --bind 127.0.0.1
goto :end

:end
echo Local preview stopped. No student answers were uploaded.
pause
endlocal

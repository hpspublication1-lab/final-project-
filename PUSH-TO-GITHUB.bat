@echo off
REM One-click publish: pushes this folder to hpspublication1-lab/final-project- (main)
REM Requires Git for Windows installed and you logged in to GitHub (it will prompt if not).

cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/hpspublication1-lab/final-project-.git
git push -f origin main
if %errorlevel% neq 0 (
  echo.
  echo Push failed. Make sure Git is installed and you are signed in to GitHub.
  pause
  exit /b 1
)
echo.
echo DONE. Open https://github.com/hpspublication1-lab/final-project- and confirm
echo package.json, tsconfig.json, src and public are visible at the root.
echo Then import in Rocket: Build ^> From GitHub.
pause

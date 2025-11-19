@echo off
echo Building UnitView Windows Application...

echo Installing dependencies...
call npm install
call npm run postinstall

echo Building application...
call npm run build:all

echo Build complete! Installer is located in the release/ directory.
pause
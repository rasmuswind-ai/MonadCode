@echo off
echo Building MonadCode MSI...

cd /d "%~dp0"

REM Restore WiX .NET tool
dotnet tool restore

REM Build the MSI
dotnet tool run wix build -arch x64 -o ..\src\dist\MonadCode_v1.1.82_x64.msi MonadCode.wxs

if %ERRORLEVEL% NEQ 0 (
    echo MSI build failed.
    exit /b 1
)

echo.
echo Done: src\dist\MonadCode.msi

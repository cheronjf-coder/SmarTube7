$env:ANDROID_HOME = "C:\Users\triad\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\triad\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "ANDROID_HOME: $env:ANDROID_HOME"
Write-Host "Running local EAS build..."

eas build --platform android --profile preview --local --non-interactive

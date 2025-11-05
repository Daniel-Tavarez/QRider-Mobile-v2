param(
  [ValidateSet('Debug','Release')]
  [string]$Variant = 'Debug',
  [switch]$RefreshDependencies
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[build] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[build] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[build] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[build] $msg" -ForegroundColor Red }

# Resolve repo root from script location
$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..')
Set-Location $RepoRoot

Write-Info "Repo root: $RepoRoot"

# Use a project-local Gradle user home to avoid locked/corrupt user cache
$LocalGradleHome = Join-Path $RepoRoot '.gradle-user'
if (-not (Test-Path $LocalGradleHome)) { New-Item -ItemType Directory -Path $LocalGradleHome | Out-Null }
$env:GRADLE_USER_HOME = $LocalGradleHome
Write-Info "Using GRADLE_USER_HOME: $env:GRADLE_USER_HOME"

# Stop any lingering Gradle/Java processes
try {
  Write-Info 'Stopping Gradle daemons'
  Push-Location (Join-Path $RepoRoot 'android')
  if (Test-Path .\gradlew.bat) { .\gradlew.bat --stop | Out-Null }
  Pop-Location
  Get-Process -Name java,gradle* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
} catch { Write-Warn "Could not stop processes: $($_.Exception.Message)" }

# Clean Android build outputs
Write-Info 'Cleaning local Android build folders (android/.gradle, android/build, android/app/build)'
@(
  (Join-Path $RepoRoot 'android\.gradle'),
  (Join-Path $RepoRoot 'android\build'),
  (Join-Path $RepoRoot 'android\app\build')
) | ForEach-Object {
  if (Test-Path $_) {
    try { Remove-Item -Recurse -Force $_ } catch { Write-Warn ("Failed to remove {0}: {1}" -f $_, $_.Exception.Message) }
  }
}

# Build
$GradleArgs = @('--no-daemon', '-g', $env:GRADLE_USER_HOME, '--stacktrace', '--info')
if ($RefreshDependencies) { $GradleArgs += '--refresh-dependencies' }

$Task = if ($Variant -eq 'Release') { 'clean','assembleRelease' } else { 'clean','assembleDebug' }

Write-Info "Building Android $Variant APK"
Push-Location (Join-Path $RepoRoot 'android')
try {
  & .\gradlew.bat @GradleArgs @Task
  $gradleExit = $LASTEXITCODE
} finally {
  Pop-Location
}

# Stop if gradle failed
if ($gradleExit -ne 0) {
  Write-Err "Gradle falló con código $gradleExit"
  exit $gradleExit
}

# Locate output APK
$OutputDir = if ($Variant -eq 'Release') { Join-Path $RepoRoot 'android\app\build\outputs\apk\release' } else { Join-Path $RepoRoot 'android\app\build\outputs\apk\debug' }
if (Test-Path $OutputDir) {
  $apk = Get-ChildItem -Path $OutputDir -Filter '*.apk' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($apk) {
    Write-Ok "APK listo: $($apk.FullName)"
    exit 0
  }
}

Write-Err 'Build completado pero no se encontró el APK esperado.'
exit 1

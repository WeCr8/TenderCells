[CmdletBinding()]
param(
  [string]$Port,
  [string]$DeviceId = "tc-cam-home-01",
  [string]$DeviceName = "Home Camera 01",
  [switch]$SkipFlash
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$firmwareDir = Join-Path $repoRoot "firmware/camera-node"

function Open-SetupUrl([string]$Url) {
  if ($IsMacOS) {
    & open $Url
  } elseif ($IsLinux) {
    & xdg-open $Url
  } else {
    Start-Process $Url
  }
}

function Find-CameraPort {
  if ($Port) { return $Port }

  if ($IsMacOS -or $IsLinux) {
    $candidate = Get-ChildItem /dev/cu.usbmodem*, /dev/ttyACM*, /dev/ttyUSB* -ErrorAction SilentlyContinue |
      Select-Object -First 1 -ExpandProperty FullName
    if ($candidate) { return $candidate }
  } else {
    $candidate = Get-CimInstance Win32_PnPEntity |
      Where-Object { $_.Name -match "\(COM\d+\)" -and $_.PNPDeviceID -match "VID_303A" } |
      ForEach-Object { [regex]::Match($_.Name, "COM\d+").Value } |
      Select-Object -First 1
    if ($candidate) { return $candidate }
  }

  throw "No Espressif USB serial device found. Plug in the camera node or pass -Port explicitly."
}

if (-not (Get-Command pio -ErrorAction SilentlyContinue)) {
  throw "PlatformIO CLI ('pio') is required. Install PlatformIO, then run this script again."
}

$Port = Find-CameraPort
Write-Host "Camera node port: $Port" -ForegroundColor Cyan

$chipOutput = & pio pkg exec --package tool-esptoolpy -- esptool.py --port $Port chip_id 2>&1 | Out-String
if ($LASTEXITCODE -ne 0 -or $chipOutput -notmatch "ESP32-S3") {
  throw "The device on $Port is not a confirmed ESP32-S3. No firmware was written.`n$chipOutput"
}
Write-Host "Verified ESP32-S3." -ForegroundColor Green

if (-not $SkipFlash) {
  Push-Location $firmwareDir
  try {
    & pio run -t upload --upload-port $Port
    if ($LASTEXITCODE -ne 0) { throw "Camera firmware upload failed." }
  } finally {
    Pop-Location
  }
  Write-Host "Camera-node firmware installed." -ForegroundColor Green
}

Write-Host ""
Write-Host "1. Join TenderCam-Setup from the Windows or macOS Wi-Fi menu."
Write-Host "2. Return here and press Enter. The script never asks for or stores your Wi-Fi password."
Read-Host | Out-Null
Open-SetupUrl "http://192.168.4.1"

Write-Host ""
Write-Host "In the camera portal:"
Write-Host "- Select your 2.4 GHz home Wi-Fi network."
Write-Host "- Enter the Wi-Fi password only in the camera portal."
Write-Host "- Set Device ID to: $DeviceId"
Write-Host "- Save, then reconnect this computer to the home Wi-Fi."
Read-Host "Press Enter after the node restarts on home Wi-Fi" | Out-Null

$streamUrl = "http://$DeviceId.local/stream"
$cameraHost = "$DeviceId.local"
$connected = $false
for ($attempt = 1; $attempt -le 20; $attempt++) {
  try {
    $addresses = [System.Net.Dns]::GetHostAddresses($cameraHost)
    if ($addresses.Count -gt 0) {
      $client = [System.Net.Sockets.TcpClient]::new()
      $task = $client.ConnectAsync($cameraHost, 80)
      if ($task.Wait(1500) -and $client.Connected) { $connected = $true }
      $client.Dispose()
    }
  } catch {}
  if ($connected) { break }
  Write-Host "Waiting for $cameraHost ($attempt/20)..."
  Start-Sleep -Seconds 2
}

if ($connected) {
  Write-Host "Camera node is reachable at $streamUrl" -ForegroundColor Green
  Open-SetupUrl $streamUrl
} else {
  Write-Warning "The node was not found at $cameraHost. Check the 2.4 GHz connection or use its router-assigned IP as http://<ip>/stream."
}

$registration = "https://tendercells.com/app/products?register=1&template=camera-kit&deviceId=$([uri]::EscapeDataString($DeviceId))&name=$([uri]::EscapeDataString($DeviceName))"
Open-SetupUrl $registration
Write-Host "TenderCells registration opened for $DeviceName ($DeviceId)."


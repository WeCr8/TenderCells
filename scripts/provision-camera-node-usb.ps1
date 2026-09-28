[CmdletBinding()]
param(
  [string]$Port = "COM4",
  [string]$DeviceId = "tc-cam-home-01",
  [string]$Broker = ""
)

$ErrorActionPreference = "Stop"
$ssid = Read-Host "2.4 GHz Wi-Fi name (SSID)"
$securePassword = Read-Host "Wi-Fi password (kept local and never printed)" -AsSecureString
$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  $payload = @{
    ssid = $ssid
    password = $password
    deviceId = $DeviceId
    broker = $Broker
  } | ConvertTo-Json -Compress
  $message = "TC_PROVISION:$payload"

  Write-Host "Resetting and provisioning the camera over $Port..." -ForegroundColor Cyan
  & pio pkg exec --package tool-esptoolpy -- esptool.py --port $Port chip_id | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not reset the ESP32-S3 on $Port." }

  $serial = [System.IO.Ports.SerialPort]::new($Port, 115200, 'None', 8, 'One')
  $serial.ReadTimeout = 250
  $serial.NewLine = "`n"
  $serial.Open()
  $deadline = [DateTime]::UtcNow.AddSeconds(28)
  $connected = $false
  while ([DateTime]::UtcNow -lt $deadline) {
    $serial.WriteLine($message)
    Start-Sleep -Milliseconds 350
    try {
      while ($serial.BytesToRead -gt 0) {
        $line = $serial.ReadLine()
        if ($line -match "\[USB\] CONNECTED") {
          Write-Host $line.Trim() -ForegroundColor Green
          $connected = $true
          break
        }
        if ($line -match "\[USB\] ERROR") { Write-Warning $line.Trim() }
      }
    } catch [System.TimeoutException] {}
    if ($connected) { break }
  }
  $serial.Close()
  if (-not $connected) { throw "The board did not confirm Wi-Fi. Check that the SSID is 2.4 GHz and retry." }

  Write-Host "Wi-Fi saved on the ESP32-S3. This computer never left its current network." -ForegroundColor Green
  Write-Host "Camera URL: http://$DeviceId.local/stream"
} finally {
  if ($serial -and $serial.IsOpen) { $serial.Close() }
  if ($passwordPtr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr) }
  $password = $null
  $message = $null
  $payload = $null
}

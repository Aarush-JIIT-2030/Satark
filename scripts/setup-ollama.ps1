$ErrorActionPreference = 'Stop'
$Model = if ($env:SATARK_OLLAMA_MODEL) { $env:SATARK_OLLAMA_MODEL } else { 'qwen2.5:3b' }
function Stop-WithMessage([string]$Message) {
  Write-Host "[SATARK Ollama setup] ERROR: $Message" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host "[SATARK Ollama setup] Ollama is not installed."
  Write-Host "This installs Ollama from the official Windows package source. SATARK's deterministic analysis works without it."
  $Confirm = Read-Host "Install Ollama with winget now? [y/N]"
  if ($Confirm -notin @('y', 'Y', 'yes', 'YES')) {
    Write-Host "Cancelled. You can install later from https://ollama.com/download/windows"
    exit 0
  }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "winget is unavailable. Install Ollama from https://ollama.com/download/windows, then rerun this script."
  }
  winget install --id Ollama.Ollama --exact --source winget --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) { Stop-WithMessage "winget installation failed." }
  $env:PATH = "$env:PATH;$env:LOCALAPPDATA\Programs\Ollama"
}

$Ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $Ollama) { Stop-WithMessage "Ollama was installed but the command is unavailable. Restart PowerShell and rerun this script." }

try {
  Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null
} catch {
  Start-Process -FilePath $Ollama.Source -ArgumentList 'serve' -WindowStyle Hidden
  $Ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
      Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null
      $Ready = $true
      break
    } catch {}
  }
  if (-not $Ready) { Stop-WithMessage "Ollama did not become ready. Open the Ollama app and rerun this script." }
}

Write-Host "[SATARK Ollama setup] Downloading $Model; this may require several GB of disk space..."
ollama pull $Model
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Model download failed. Check internet/disk space and rerun: ollama pull $Model" }
Write-Host "[SATARK Ollama setup] Ready. For Next.js set SATARK_OLLAMA_BASE_URL=http://127.0.0.1:11434 and SATARK_OLLAMA_MODEL=$Model"
Write-Host "For Streamlit, configure OLLAMA_BASE_URL and the model setting described in ai_provider.py."
Write-Host "If Ollama is unavailable, SATARK's deterministic fallback still works. Hosted Vercel cannot access Ollama on your personal computer."

param(
  [switch]$Minimized = $true
)

$root = Split-Path -Parent $PSScriptRoot
$windowStyle = if ($Minimized) { 'Minimized' } else { 'Normal' }

function Start-JobWindow($name, $cmd) {
  Write-Host "Starting $name..."
  $command = "cd /d `"$root`" && $cmd"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $command -WindowStyle $windowStyle | Out-Null
}

Start-JobWindow "Dawn UI" "pnpm dev:dawn-ui"
Start-JobWindow "Ollama Orchestrator" "set PORT=4000 && pnpm --filter eideus-ollama-orchestrator dev"
Start-JobWindow "Affinity System (Watch)" "pnpm --filter eideus-affinity-system dev"
Start-JobWindow "XP System (Watch)" "pnpm --filter eideus-xp-system dev"

Write-Host "All services launched."


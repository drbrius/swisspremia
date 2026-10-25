<#
  Schluessel sicher setzen und pruefen: ElevenLabs (Stimme) und Vercel Blob (Ablage).

    powershell -ExecutionPolicy Bypass -File .\schluessel-setzen.ps1              abfragen, pruefen, speichern
    powershell -ExecutionPolicy Bypass -File .\schluessel-setzen.ps1 -NurPruefen  gespeicherte Werte nur pruefen

  Die Eingabe wird nicht angezeigt. Anfuehrungszeichen und Leerzeichen am Rand
  werden entfernt. Gespeichert wird nur ein Wert, der die richtige Form hat
  (sk_... bzw. vercel_blob_rw_...) und den der Dienst live annimmt.
  Enter ohne Eingabe laesst den gespeicherten Wert unveraendert.
#>
param([switch]$NurPruefen)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Lesen([string]$text) {
  $sicher = Read-Host -Prompt $text -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sicher)
  try { $wert = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  return ($wert -replace '^[\s"'']+', '' -replace '[\s"'']+$', '')
}

# Live-Test ueber Node (dieselben Bibliotheken wie der Funnel). Gibt "ok" oder einen Fehlertext zurueck.
function Testen([string]$art, [string]$wert) {
  $env:SP_TESTWERT = $wert
  $env:SP_STIMME = [Environment]::GetEnvironmentVariable("ELEVENLABS_VOICE_ID", "User")
  if (-not $env:SP_STIMME) { $env:SP_STIMME = "XrExE9yKIg1WjnnlVkGX" }
  if ($art -eq "elevenlabs") {
    $js = 'const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + process.env.SP_STIMME + "?output_format=mp3_44100_128", { method: "POST", headers: { "xi-api-key": process.env.SP_TESTWERT, "Content-Type": "application/json" }, body: JSON.stringify({ text: "Test.", model_id: "eleven_multilingual_v2" }) }); console.log(r.ok ? "ok" : "HTTP " + r.status + " " + (await r.text()).slice(0, 120));'
  } else {
    $js = 'import { list } from "@vercel/blob"; try { await list({ token: process.env.SP_TESTWERT, limit: 1 }); console.log("ok"); } catch (e) { console.log(e.message.slice(0, 120)); }'
  }
  $ergebnis = ($js | node --input-type=module - 2>&1 | Out-String).Trim()
  Remove-Item Env:SP_TESTWERT, Env:SP_STIMME -ErrorAction SilentlyContinue
  return $ergebnis
}

$schluessel = @(
  @{ Name = "ELEVENLABS_API_KEY"; Art = "elevenlabs"; Muster = '^sk_[A-Za-z0-9]{20,}$'; Text = "ElevenLabs API-Schluessel (beginnt mit sk_)" },
  @{ Name = "BLOB_READ_WRITE_TOKEN"; Art = "blob"; Muster = '^vercel_blob_rw_[A-Za-z0-9_]{10,}$'; Text = "Vercel Blob Token (beginnt mit vercel_blob_rw_)" }
)

foreach ($s in $schluessel) {
  Write-Host ""
  if ($NurPruefen) {
    $wert = [Environment]::GetEnvironmentVariable($s.Name, "User")
    if (-not $wert) { Write-Host ("{0}: nicht gesetzt" -f $s.Name); continue }
  } else {
    $wert = Lesen $s.Text
    if (-not $wert) { Write-Host "  unveraendert gelassen."; $wert = [Environment]::GetEnvironmentVariable($s.Name, "User"); if (-not $wert) { continue } }
  }
  if ($wert -notmatch $s.Muster) {
    Write-Host ("{0}: falsche Form ({1} Zeichen, beginnt nicht mit dem erwarteten Anfang oder enthaelt Leerzeichen)." -f $s.Name, $wert.Length) -ForegroundColor Red
    if ($NurPruefen) { Write-Host "  Neu setzen: powershell -ExecutionPolicy Bypass -File .\schluessel-setzen.ps1" }
    else { Write-Host "  Nicht gespeichert. Den Schluessel direkt aus dem Fenster kopieren, in dem er beim Anlegen angezeigt wird." }
    continue
  }
  $test = Testen $s.Art $wert
  if ($test -ne "ok") {
    Write-Host ("{0}: Form stimmt, aber der Dienst lehnt ab: {1}" -f $s.Name, $test) -ForegroundColor Red
    if (-not $NurPruefen) { Write-Host "  Nicht gespeichert." }
    continue
  }
  if (-not $NurPruefen) { [Environment]::SetEnvironmentVariable($s.Name, $wert, "User") }
  Write-Host ("{0}: in Ordnung ({1} Zeichen){2}" -f $s.Name, $wert.Length, $(if ($NurPruefen) { "" } else { ", gespeichert" })) -ForegroundColor Green
}
Write-Host ""

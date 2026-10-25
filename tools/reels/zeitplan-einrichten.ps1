<#
  SwissPremia Reels - Zeitplan einrichten (Windows-Aufgabenplanung)

    .\zeitplan-einrichten.ps1                  Schluessel abfragen, zwei Aufgaben anlegen
    .\zeitplan-einrichten.ps1 -OhneSchluessel  nur die Aufgaben anlegen/erneuern
    .\zeitplan-einrichten.ps1 -Status          Aufgaben und letzte Laeufe zeigen
    .\zeitplan-einrichten.ps1 -Entfernen       beide Aufgaben loeschen

  Aufgabe 1 "SwissPremia Reels - Tag":    taeglich um -TagesStart (Standard 05:30) node tag.js
  Aufgabe 2 "SwissPremia Reels - Posten": alle -TaktMinuten (Standard 15) node posten.js

  Schluessel und Tokens werden als NUTZER-Umgebungsvariablen gespeichert
  (Systemsteuerung > Umgebungsvariablen), nicht in Dateien: Der Ordner liegt
  in OneDrive und das Repository ist oeffentlich. Die Aufgabenplanung liest
  Nutzer-Umgebungsvariablen beim Start jeder Aufgabe.

  Der Rechner muss laufen (oder aus dem Ruhezustand geweckt werden koennen);
  ein zugeklappter Laptop postet nichts. Siehe FUNNEL.md.
#>
param(
  [switch]$OhneSchluessel,
  [switch]$Entfernen,
  [switch]$Status,
  [string]$TagesStart = "05:30",
  [int]$TaktMinuten = 15
)

$ErrorActionPreference = "Stop"
$NameTag = "SwissPremia Reels - Tag"
$NamePosten = "SwissPremia Reels - Posten"
$Ordner = $PSScriptRoot

if ($Status) {
  foreach ($n in @($NameTag, $NamePosten)) {
    $t = Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue
    if ($null -eq $t) { Write-Host "$n : nicht eingerichtet"; continue }
    $i = $t | Get-ScheduledTaskInfo
    Write-Host ("{0} : {1}, letzter Lauf {2} (Ergebnis {3}), naechster {4}" -f $n, $t.State, $i.LastRunTime, $i.LastTaskResult, $i.NextRunTime)
  }
  $protokoll = Join-Path $Ordner "plan\protokoll.log"
  if (Test-Path $protokoll) { Write-Host "`nLetzte Protokollzeilen:"; Get-Content $protokoll -Tail 12 }
  exit 0
}

if ($Entfernen) {
  foreach ($n in @($NameTag, $NamePosten)) {
    if (Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $n -Confirm:$false; Write-Host "Entfernt: $n" }
  }
  exit 0
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "node.exe nicht gefunden - Node.js installieren oder PATH pruefen." }

# Aufgaben ohne sichtbares Fenster starten (unsichtbar.vbs): Ein Konsolenfenster
# liesse sich schliessen und braeche den Lauf ab (Ergebnis 0xC000013A).
# conhost --headless versteckt es auch, verliert aber den Rueckgabewert.
function Aktion([string]$skript) {
  New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\wscript.exe" -Argument "`"$Ordner\unsichtbar.vbs`" `"$node`" $skript" -WorkingDirectory $Ordner
}

if (-not $OhneSchluessel) {
  Write-Host "Schluessel als Nutzer-Umgebungsvariablen speichern. Enter = bestehenden Wert behalten.`n"
  $variablen = @(
    @{ Name = "ELEVENLABS_API_KEY";    Text = "ElevenLabs API-Schluessel (Stimme; leer = stumm rendern)" },
    @{ Name = "ELEVENLABS_VOICE_ID";   Text = "ElevenLabs Voice-Id (z. B. Matilda XrExE9yKIg1WjnnlVkGX)" },
    @{ Name = "BLOB_READ_WRITE_TOKEN"; Text = "Vercel Blob Token (Ablage der Videos)" },
    @{ Name = "META_APP_ID";           Text = "Meta App-Id (nur fuer instagram.js verbinden)" },
    @{ Name = "META_APP_SECRET";       Text = "Meta App-Secret (nur fuer instagram.js verbinden)" },
    @{ Name = "IG_USER_ID";            Text = "Instagram Konto-Id (setzt instagram.js verbinden selbst)" },
    @{ Name = "IG_ACCESS_TOKEN";       Text = "Instagram Zugriffstoken (setzt instagram.js verbinden selbst)" }
  )
  foreach ($v in $variablen) {
    $alt = [Environment]::GetEnvironmentVariable($v.Name, "User")
    $hinweis = if ($alt) { " [gesetzt, " + $alt.Length + " Zeichen]" } else { " [leer]" }
    $neu = Read-Host ($v.Text + $hinweis)
    if ($neu) { [Environment]::SetEnvironmentVariable($v.Name, $neu.Trim(), "User"); Write-Host "  gespeichert." }
  }
  Write-Host ""
}

$einstellungen = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun `
  -ExecutionTimeLimit (New-TimeSpan -Hours 3) -MultipleInstances IgnoreNew -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 10)

$aktionTag = Aktion "tag.js"
$ausloeserTag = New-ScheduledTaskTrigger -Daily -At $TagesStart
Register-ScheduledTask -TaskName $NameTag -Action $aktionTag -Trigger $ausloeserTag -Settings $einstellungen `
  -Description "Plant, vertont, rendert und laedt die Reels des Tages hoch (tools/reels/tag.js)." -Force | Out-Null
Write-Host "Eingerichtet: $NameTag - taeglich $TagesStart"

$einstellungenPosten = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
$aktionPosten = Aktion "posten.js"
$ausloeserPosten = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes $TaktMinuten) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName $NamePosten -Action $aktionPosten -Trigger $ausloeserPosten -Settings $einstellungenPosten `
  -Description "Veroeffentlicht faellige Reels auf Instagram (tools/reels/posten.js)." -Force | Out-Null
Write-Host "Eingerichtet: $NamePosten - alle $TaktMinuten Minuten"

Write-Host "`nPruefen:  .\zeitplan-einrichten.ps1 -Status"
Write-Host "Sofort testen:  node tag.js --nur-plan   und   node funnel/instagram.js pruefen  (neues Fenster, damit die Variablen gelten)"

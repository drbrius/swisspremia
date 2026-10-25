' Startet ein Programm ohne sichtbares Fenster, wartet auf sein Ende und
' gibt dessen Rueckgabewert an die Aufgabenplanung weiter.
'
'   wscript.exe unsichtbar.vbs "C:\Program Files\nodejs\node.exe" tag.js
'
' Gebraucht von zeitplan-einrichten.ps1: Ohne diesen Starter oeffnet jeder
' Lauf ein Konsolenfenster, und wer es schliesst, bricht den Lauf ab
' (Ergebnis 0xC000013A). conhost --headless versteckt das Fenster auch,
' verliert aber den Rueckgabewert.
Option Explicit
Dim sh, i, a, befehl
Set sh = CreateObject("WScript.Shell")
befehl = ""
For i = 0 To WScript.Arguments.Count - 1
  a = WScript.Arguments(i)
  If InStr(a, " ") > 0 Then a = Chr(34) & a & Chr(34)
  befehl = befehl & " " & a
Next
WScript.Quit sh.Run(Trim(befehl), 0, True)

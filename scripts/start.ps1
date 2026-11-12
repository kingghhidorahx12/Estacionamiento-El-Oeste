param([string]$JavaHome = $env:JAVA_HOME)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not $JavaHome) { throw 'Indica -JavaHome o configura JAVA_HOME.' }
$setupStatus = & (Join-Path $JavaHome 'bin\java.exe') -cp 'build/classes;.dev/lib/*' mx.eloeste.desktop.Main --setup-status
if ($LASTEXITCODE -ne 0) { throw 'No se pudo abrir la base de datos.' }
if ($setupStatus -eq 'setup-required') {
    $env:OESTE_ADMIN_USER = Read-Host 'Usuario administrador'
    $securePassword = Read-Host 'PIN personal (6 a 12 dígitos)' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try { $env:OESTE_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
}
try { & (Join-Path $JavaHome 'bin\java.exe') -cp 'build/classes;.dev/lib/*' mx.eloeste.desktop.Main }
finally { Remove-Item Env:OESTE_ADMIN_PASSWORD -ErrorAction SilentlyContinue }

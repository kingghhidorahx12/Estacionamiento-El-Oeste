param([string]$JavaHome = $env:JAVA_HOME, [switch]$Test)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not $JavaHome) { throw 'Indica -JavaHome RUTA_JDK_21 o configura JAVA_HOME.' }
$javac = Join-Path $JavaHome 'bin\javac.exe'
$java = Join-Path $JavaHome 'bin\java.exe'
New-Item -ItemType Directory -Force -Path build\classes | Out-Null
$sourceFiles = @(Get-ChildItem core\src,desktop\src -Recurse -Filter *.java) + @(Get-ChildItem tests -Filter *.java)
$sources = @($sourceFiles | ForEach-Object { '"' + $_.FullName.Replace('\','/') + '"' })
[IO.File]::WriteAllLines((Join-Path (Get-Location) 'build\sources.txt'), $sources, [Text.UTF8Encoding]::new($false))
& $javac --release 17 -encoding UTF-8 -cp '.dev/lib/*' -d build/classes '@build/sources.txt'
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación Java.' }
if ($Test) {
    & $java -cp 'build/classes;.dev/lib/*' OesteTests; if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas base.' }
    & $java -cp 'build/classes;.dev/lib/*' ContinuationTests; if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de requisitos consolidados.' }
    & $java -cp 'build/classes;.dev/lib/*' PersistenceTests; if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de persistencia en disco.' }
}

param([string]$JavaHome=$env:JAVA_HOME)
$ErrorActionPreference='Stop'
if (-not $JavaHome) { throw 'Indica -JavaHome con JDK 21.' }
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Push-Location $projectRoot
try {
    New-Item -ItemType Directory -Force build/cloud-oracle | Out-Null
    & (Join-Path $JavaHome 'bin/javac.exe') --release 17 -encoding UTF-8 -cp '.dev/lib/json.jar' -d build/cloud-oracle core/src/mx/eloeste/core/Rules.java tests/CloudRulesVectors.java
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el oráculo Java.' }
    & (Join-Path $JavaHome 'bin/java.exe') -cp 'build/cloud-oracle;.dev/lib/json.jar' CloudRulesVectors build/cloud-oracle/vectors.json
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo ejecutar el oráculo Java.' }
    node -e "const fs=require('fs'),z=require('zlib');fs.writeFileSync('cloud/tests/fixtures/java-rules-v1.json.gz',z.gzipSync(fs.readFileSync('build/cloud-oracle/vectors.json')))"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar el fixture sintético.' }
} finally { Pop-Location }

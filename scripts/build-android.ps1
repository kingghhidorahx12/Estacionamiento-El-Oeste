param([string]$JavaHome = $env:JAVA_HOME, [string]$AndroidSdk = $env:ANDROID_HOME)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not $JavaHome -or -not $AndroidSdk) { throw 'Indica -JavaHome y -AndroidSdk (JDK 21 y SDK 35 o superior).' }
$env:JAVA_HOME = $JavaHome
$bt = Join-Path $AndroidSdk 'build-tools\35.0.0'
$androidJar = Join-Path $AndroidSdk 'platforms\android-35\android.jar'
New-Item -ItemType Directory -Force -Path build\android-classes,build\android-dex,artifacts,.dev\signing | Out-Null
$sources = @(Get-ChildItem core\src,android\src -Recurse -Filter *.java | ForEach-Object { '"' + $_.FullName.Replace('\','/') + '"' })
[IO.File]::WriteAllLines((Join-Path (Get-Location) 'build\android-sources.txt'), $sources, [Text.UTF8Encoding]::new($false))
& (Join-Path $JavaHome 'bin\javac.exe') --release 17 -encoding UTF-8 -cp ".dev/lib/json.jar;$androidJar" -d build/android-classes '@build/android-sources.txt'
if ($LASTEXITCODE -ne 0) { throw 'Falló javac Android.' }
& (Join-Path $JavaHome 'bin\jar.exe') --create --file build/android-code.jar -C build/android-classes .
if ($LASTEXITCODE -ne 0) { throw 'Falló jar.' }
& (Join-Path $bt 'd8.bat') --lib $androidJar --min-api 29 --output build/android-dex build/android-code.jar
if ($LASTEXITCODE -ne 0) { throw 'Falló D8.' }
& (Join-Path $bt 'aapt2.exe') compile --dir android/res -o build/android-res.zip
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación de recursos Android.' }
& (Join-Path $bt 'aapt2.exe') link -I $androidJar --manifest android/AndroidManifest.xml -R build/android-res.zip -A web -o build/oeste-unsigned.apk --min-sdk-version 29 --target-sdk-version 35
if ($LASTEXITCODE -ne 0) { throw 'Falló AAPT2.' }
python scripts/package-dex.py
if ($LASTEXITCODE -ne 0) { throw 'Falló el empaquetado DEX.' }
& (Join-Path $bt 'zipalign.exe') -f -p 4 build/oeste-unsigned.apk build/oeste-aligned.apk
if ($LASTEXITCODE -ne 0) { throw 'Falló zipalign.' }
if (-not (Test-Path .dev/signing/development.jks)) {
    & (Join-Path $JavaHome 'bin\keytool.exe') -genkeypair -keystore .dev/signing/development.jks -storepass android -keypass android -alias oeste-dev -keyalg RSA -keysize 2048 -validity 3650 -dname 'CN=El Oeste Development'
    if ($LASTEXITCODE -ne 0) { throw 'Falló la firma de desarrollo.' }
}
& (Join-Path $bt 'apksigner.bat') sign --ks .dev/signing/development.jks --ks-key-alias oeste-dev --ks-pass pass:android --key-pass pass:android --out artifacts/El-Oeste-0.3.0-pruebas.apk build/oeste-aligned.apk
if ($LASTEXITCODE -ne 0) { throw 'Falló apksigner.' }
& (Join-Path $bt 'apksigner.bat') verify --verbose artifacts/El-Oeste-0.3.0-pruebas.apk
if ($LASTEXITCODE -ne 0) { throw 'Firma inválida.' }
Get-FileHash -Algorithm SHA256 artifacts/El-Oeste-0.3.0-pruebas.apk
Write-Output 'APK de pruebas. Clave de desarrollo: no distribuir como versión de producción.'

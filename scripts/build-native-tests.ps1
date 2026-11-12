param([string]$JavaHome=$env:JAVA_HOME,[string]$AndroidSdk=$env:ANDROID_HOME)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:JAVA_HOME=$JavaHome
$bt=Join-Path $AndroidSdk 'build-tools\35.0.0'
$androidJar=Join-Path $AndroidSdk 'platforms\android-35\android.jar'
New-Item -ItemType Directory -Force -Path build\test-classes,build\test-dex,.dev\test-assets | Out-Null
if (-not (Test-Path .dev/test-assets/tls-test.p12)) {
  & (Join-Path $JavaHome 'bin\keytool.exe') -genkeypair -alias test -keyalg RSA -keysize 2048 -validity 10 -dname 'CN=Local Native Test' -keystore .dev/test-assets/tls-test.p12 -storetype PKCS12 -storepass test-only-strong-password
  if ($LASTEXITCODE -ne 0) { throw 'Falló certificado de prueba.' }
}
& (Join-Path $JavaHome 'bin\javac.exe') --release 17 -encoding UTF-8 -cp ".dev/lib/json.jar;$androidJar;build/android-classes" -d build/test-classes tests/android/NativeSmoke.java
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación de pruebas nativas.' }
& (Join-Path $JavaHome 'bin\jar.exe') --create --file build/native-tests.jar -C build/test-classes .
& (Join-Path $bt 'd8.bat') --lib $androidJar --classpath build/android-code.jar --min-api 29 --output build/test-dex build/native-tests.jar
if ($LASTEXITCODE -ne 0) { throw 'Falló D8 de pruebas.' }
& (Join-Path $bt 'aapt2.exe') link -I $androidJar --manifest tests/android/AndroidManifest.xml -A .dev/test-assets -o build/oeste-test-unsigned.apk --min-sdk-version 29 --target-sdk-version 35
if ($LASTEXITCODE -ne 0) { throw 'Falló AAPT2 de pruebas.' }
python -c "from zipfile import ZipFile; z=ZipFile('build/oeste-test-unsigned.apk','a'); z.write('build/test-dex/classes.dex','classes.dex'); z.close()"
& (Join-Path $bt 'zipalign.exe') -f -p 4 build/oeste-test-unsigned.apk build/oeste-test-aligned.apk
& (Join-Path $bt 'apksigner.bat') sign --ks .dev/signing/development.jks --ks-key-alias oeste-dev --ks-pass pass:android --key-pass pass:android --out .dev/native-tests.apk build/oeste-test-aligned.apk
if ($LASTEXITCODE -ne 0) { throw 'Falló la firma de pruebas.' }

param([Parameter(Mandatory=$true)][string]$Ip, [string]$JavaHome=$env:JAVA_HOME, [string]$CertificateDirectory=".dev/tls", [string]$PasswordEnvironment)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$parsedIp = $null
if (-not [Net.IPAddress]::TryParse($Ip,[ref]$parsedIp) -or $parsedIp.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { throw 'Indica la IPv4 reservada para la tablet en el router.' }
if (-not $JavaHome) { throw 'Indica -JavaHome con el JDK 21.' }
New-Item -ItemType Directory -Force -Path $CertificateDirectory | Out-Null
if (Test-Path (Join-Path $CertificateDirectory "server.p12")) { throw 'Ya existe .dev/tls/server.p12. Conserva la CA y el certificado existentes; genera una renovación en otra carpeta expresamente.' }
if ($PasswordEnvironment) { $env:OESTE_CERT_PASS=[Environment]::GetEnvironmentVariable($PasswordEnvironment); if (-not $env:OESTE_CERT_PASS) { throw 'Variable de contraseña no configurada.' } }
else {
    $secret = Read-Host 'Contraseña para CA y server.p12 (mínimo 12 caracteres)' -AsSecureString
    $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $env:OESTE_CERT_PASS=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
if ($env:OESTE_CERT_PASS.Length -lt 12) { Remove-Item Env:OESTE_CERT_PASS; throw 'Se requieren 12 caracteres como mínimo.' }
$keytool=Join-Path $JavaHome 'bin\keytool.exe'
function Invoke-Keytool([string[]]$Arguments) { $resolvedArguments=@($Arguments | ForEach-Object { $_.Replace(".dev/tls/",$CertificateDirectory.TrimEnd("/","\")+"/") }); & $keytool @resolvedArguments; if ($LASTEXITCODE -ne 0) { throw 'Falló la generación de certificados. Conserva los archivos y revisa el error.' } }
try {
    if (-not (Test-Path (Join-Path $CertificateDirectory "ca.p12"))) {
        Invoke-Keytool @('-genkeypair','-alias','oeste-ca','-keyalg','RSA','-keysize','3072','-validity','3650','-dname','CN=El Oeste CA Local','-ext','BC=ca:true,pathlen:0','-ext','KU=keyCertSign,cRLSign','-keystore','.dev/tls/ca.p12','-storetype','PKCS12','-storepass:env','OESTE_CERT_PASS')
    }
    Invoke-Keytool @('-exportcert','-alias','oeste-ca','-keystore','.dev/tls/ca.p12','-storepass:env','OESTE_CERT_PASS','-file','.dev/tls/El-Oeste-CA.cer')
    Invoke-Keytool @('-genkeypair','-alias','server','-keyalg','RSA','-keysize','2048','-validity','365','-dname','CN=El Oeste Servidor Local','-keystore','.dev/tls/server.p12','-storetype','PKCS12','-storepass:env','OESTE_CERT_PASS')
    Invoke-Keytool @('-certreq','-alias','server','-keystore','.dev/tls/server.p12','-storepass:env','OESTE_CERT_PASS','-file','.dev/tls/server.csr')
    Invoke-Keytool @('-gencert','-alias','oeste-ca','-keystore','.dev/tls/ca.p12','-storepass:env','OESTE_CERT_PASS','-infile','.dev/tls/server.csr','-outfile','.dev/tls/server.cer','-validity','365','-ext',"SAN=IP:$Ip,IP:127.0.0.1,DNS:localhost",'-ext','KU=digitalSignature,keyEncipherment','-ext','EKU=serverAuth')
    Invoke-Keytool @('-importcert','-noprompt','-alias','oeste-ca','-keystore','.dev/tls/server.p12','-storepass:env','OESTE_CERT_PASS','-file','.dev/tls/El-Oeste-CA.cer')
    Invoke-Keytool @('-importcert','-alias','server','-keystore','.dev/tls/server.p12','-storepass:env','OESTE_CERT_PASS','-file','.dev/tls/server.cer')
    Write-Output "Generados $CertificateDirectory/server.p12 para la tablet y $CertificateDirectory/El-Oeste-CA.cer para cada teléfono. Conserva $CertificateDirectory/ca.p12 fuera de los teléfonos y del repositorio."
} finally { Remove-Item Env:OESTE_CERT_PASS -ErrorAction SilentlyContinue }

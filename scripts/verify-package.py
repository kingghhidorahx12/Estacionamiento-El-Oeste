"""Verify the delivered APK and package the browser assets without operational data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root=Path(__file__).resolve().parent.parent
apk=root/'artifacts/El-Oeste-0.3.0-pruebas.apk'
forbidden=('.sqlite','.p12','.jks','.oeste','.pem','.key','.cer','.csr','qa.html','qa.js','credential.txt')
with ZipFile(apk) as package:
    names=package.namelist()
    assert 'classes.dex' in names and 'AndroidManifest.xml' in names
    assert not any(name.endswith(forbidden) for name in names), 'Private or test data in APK'
    for path in (root/'web').rglob('*'):
        if path.is_file():
            member='assets/'+path.relative_to(root/'web').as_posix()
            assert hashlib.sha256(package.read(member)).digest()==hashlib.sha256(path.read_bytes()).digest(), 'Stale packaged asset: '+member
    assert 'assets/assets/mark.svg' in names and 'assets/atelier.css' in names
    assert not any('mx/elmuelle' in name.lower() for name in names)
webzip=root/'artifacts/El-Oeste-Web-0.3.0.zip'
with ZipFile(webzip,'w',ZIP_DEFLATED) as out:
    for path in (root/'web').rglob('*'):
        if path.is_file():out.write(path,'web/'+path.relative_to(root/'web').as_posix())
    out.write(root/'README.md','README.md')
    out.write(root/'THIRD_PARTY.md','THIRD_PARTY.md')
    for path in (root/'docs').glob('*.md'):out.write(path,'docs/'+path.name)
    out.writestr('LEEME.txt','Interfaz PWA de El Oeste 0.3.0. Requiere la API del servidor Android local; no abrir index.html como archivo suelto. Instala la APK de pruebas y accede por su URL HTTPS. Código completo: https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste\n')
manifest={path.name:{'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for path in (apk,webzip)}
(root/'artifacts/SHA256SUMS.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,indent=2))
print('PASS: packaged assets match source; no database, QR collection, certificate or private key in APK.')

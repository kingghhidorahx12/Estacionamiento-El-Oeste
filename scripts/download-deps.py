import urllib.request, pathlib, hashlib, json
lock=json.loads(pathlib.Path("dependencies.lock.json").read_text())
files = {
'.dev/lib/json.jar':'https://repo.maven.apache.org/maven2/org/json/json/20250517/json-20250517.jar',
'.dev/lib/sqlite.jar':'https://repo.maven.apache.org/maven2/org/xerial/sqlite-jdbc/3.50.3.0/sqlite-jdbc-3.50.3.0.jar',
'.dev/lib/slf4j-api.jar':'https://repo.maven.apache.org/maven2/org/slf4j/slf4j-api/2.0.17/slf4j-api-2.0.17.jar',
'.dev/lib/slf4j-nop.jar':'https://repo.maven.apache.org/maven2/org/slf4j/slf4j-nop/2.0.17/slf4j-nop-2.0.17.jar',
'web/vendor/jsQR.js':'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
'web/vendor/qrcode.js':'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
}
for dest,url in files.items():
    data=urllib.request.urlopen(url,timeout=30).read()
    assert hashlib.sha256(data).hexdigest()==lock[dest]['sha256'], 'Dependency checksum mismatch: '+dest
    pathlib.Path(dest).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(dest).write_bytes(data)
    print(dest,len(data),hashlib.sha256(data).hexdigest())

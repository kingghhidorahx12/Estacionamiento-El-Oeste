import urllib.request, pathlib, hashlib, json
lock=json.loads(pathlib.Path("dependencies.lock.json").read_text())
items={
'web/vendor/tesseract.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
'web/vendor/worker.min.js':'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
'web/vendor/tesseract-core-lstm.wasm.js':'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js',
'web/vendor/tesseract-core-lstm.wasm':'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm',
'web/vendor/eng.traineddata.gz':'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz'
}
for name,url in items.items():
    data=urllib.request.urlopen(url,timeout=45).read();assert hashlib.sha256(data).hexdigest()==lock[name]['sha256'], 'OCR checksum mismatch: '+name;pathlib.Path(name).parent.mkdir(parents=True,exist_ok=True);pathlib.Path(name).write_bytes(data);print(name,len(data),hashlib.sha256(data).hexdigest())

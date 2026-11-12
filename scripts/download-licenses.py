import urllib.request,pathlib
files={
'jsQR-LICENSE':'https://raw.githubusercontent.com/cozmo/jsQR/master/LICENSE',
'qrcode-LICENSE':'https://raw.githubusercontent.com/kazuhikoarase/qrcode-generator/master/LICENSE',
'Tesseract-LICENSE':'https://raw.githubusercontent.com/naptha/tesseract.js/master/LICENSE.md',
'Tessdata-LICENSE':'https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/LICENSE'
}
root=pathlib.Path('web/vendor/licenses');root.mkdir(exist_ok=True)
for name,url in files.items():
 try:
  data=urllib.request.urlopen(url,timeout=30).read();(root/name).write_bytes(data);print(name,len(data))
 except Exception as e:print(name,type(e).__name__,str(e))

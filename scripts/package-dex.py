from pathlib import Path
from zipfile import ZipFile, ZIP_STORED, ZipInfo
source = Path('build/oeste-unsigned.apk')
with ZipFile(source) as apk:
    entries = [(item.filename, apk.read(item), item.compress_type) for item in apk.infolist()]
with ZipFile(source, 'w') as apk:
    for name, data, compression in entries:
        info = ZipInfo(name, (2026, 11, 12, 0, 0, 0))
        info.compress_type = compression
        apk.writestr(info, data)
    for dex in Path('build/android-dex').glob('*.dex'):
        info = ZipInfo(dex.name, (2026, 11, 12, 0, 0, 0))
        info.compress_type = ZIP_STORED
        apk.writestr(info, dex.read_bytes())

"""Loopback-only browser fixture: real bundled OCR and production CSP, no camera."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        name=path.split('?',1)[0].lstrip('/')
        if name in ('','ocr-browser.js'):return str(ROOT/'tests'/('ocr-browser.html' if not name else name))
        target=(ROOT/'web'/name).resolve()
        return str(target) if target.is_relative_to(ROOT/'web') else str(ROOT/'missing')
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        super().end_headers()
    def log_message(self,*args):pass
print('OCR fixture http://localhost:8798',flush=True)
ThreadingHTTPServer(('127.0.0.1',8798),Handler).serve_forever()

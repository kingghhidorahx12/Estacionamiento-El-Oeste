# Recursos de terceros

Los recursos web se sirven desde la tablet, sin CDN en tiempo de operación.

| Recurso | Uso y licencia | Procedencia |
|---|---|---|
| Manrope regular / semibold | Tipografía, SIL Open Font License 1.1. Aviso completo en `web/assets/fonts/OFL.txt`. | https://github.com/sharanda/manrope |
| Rye | Marca y rótulos comerciales, SIL Open Font License 1.1; `web/assets/fonts/Rye-OFL.txt`. | https://github.com/google/fonts/tree/main/ofl/rye |
| pdf-lib 1.17.1 | PDF carta generado localmente, MIT; aviso en `web/vendor/pdf-lib.LICENSE.md`. SHA-256 del JS: `0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f`. | https://github.com/Hopding/pdf-lib |
| jsQR 1.4.0 | Lectura QR local, Apache-2.0. | https://github.com/cozmo/jsQR |
| qrcode-generator 1.4.4 | Generación vectorial de tarjetas, MIT. | https://github.com/kazuhikoarase/qrcode-generator |
| Tesseract.js y core 5.1.1 | OCR local, Apache-2.0. | https://github.com/naptha/tesseract.js |
| Modelo inglés Tesseract fast | Lectura tentativa de placas, Apache-2.0. | https://github.com/naptha/tessdata/tree/gh-pages/4.0.0_fast |
| JSON-java 20250517 | JSON en pruebas y compilación, licencia incluida por el proyecto. Android usa su implementación del sistema. | https://github.com/stleary/JSON-java |
| SQLite JDBC 3.50.3.0 | Base del host de desarrollo, Apache-2.0 / BSD según componentes. No se incluye en el runtime Android. | https://github.com/xerial/sqlite-jdbc |
| SLF4J 2.0.17 | Adaptador del host de pruebas, MIT. | https://www.slf4j.org/ |

Los scripts fijan versiones. Los avisos de los archivos originales se conservan; no se ha copiado identidad ni ilustraciones comerciales de El Muelle. Los archivos descargados deben acompañarse de los avisos de licencia en `web/vendor/licenses/` al redistribuir.

La marca vigente es una fachada comercial simplificada con letras EO y rótulo Rye. Se compone con geometría y contornos tipográficos propios del proyecto mediante `scripts/BrandAssets.java`; no copia la marca de El Muelle. Inspiración: fachadas comerciales descritas por el [National Park Service](https://www.nps.gov/klgo/learn/historyculture/boas.htm) y rótulos de madera del siglo XIX documentados por [Smithsonian](https://americanhistory.si.edu/collections/archival-item/sova-nmah-ac-0060-s01-01-lumber-ref70). La ilustración conceptual anterior `oeste-panorama.png` se conserva como recurso histórico, sin colocarse detrás de información operativa.

La ilustración vigente `web/assets/oeste-patio-pintado.png` se generó con la herramienta integrada image_gen y sustituye el dibujo SVG/Canvas anterior. Se conserva el logotipo EO existente. La ilustración no representa una fotografía de la instalación. Prompt de producción guardado junto a la evidencia local en `artifacts/Prompt-ilustracion-0.8.txt`. No se redistribuyen las referencias de emblemas ni OpenCV examinados durante el prototipo descartado. OCR conserva los modelos LSTM/SIMD locales fijados en `dependencies.lock.json`.

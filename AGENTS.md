# Estacionamiento El Oeste

Continúa el código existente. Fuente consolidada del propietario: 12/11/2026; estado, evidencia y pendientes en `docs/ESTADO.md`. Arquitectura Android/web local y réplica de consulta Cloudflare. El destino es GitHub; no migrar a Sites.

- No modificar El Muelle, sus archivos, APK, datos, claves, permisos ni USB. Glass Atelier es referencia de composición; no copiar su identidad. No usar Kahatsa Core como referencia visual.
- La tablet es autoridad de hora, SQLite, entradas y pagos. Mantener atomicidad, autorización e idempotencia. La nube no habilita operaciones locales.
- Importes enteros en centavos. Tiempo libre normal $50 y preferencial $60, en ese orden. El complemento de lavado es otra modalidad de $30. Van se muestra únicamente como «Van».
- Mensualidades: 12 h nocturnas $500, 24 h $600; fechas explícitas. Horario nocturno y jornada permanecen pendientes hasta configuración humana. Sin recargos ni renovaciones inventados. Temporal $100/12 h es provisional.
- Fotografías sólo en memoria del teléfono. No subir vehículos ni secretos QR a Cloudflare. No registrar secretos en logs.
- Antes de publicar: revisar la lista exacta de archivos, ejecutar pruebas afectadas y la integración final. Nunca incluir `.dev`, `data`, bases, respaldos, certificados, PIN, QR productivos, claves ni APK privadas en Git.
- Herramientas: JDK 21 y SDK Android 35. `scripts/build.ps1 -Test` prueba Java; `node --test tests/remote.test.mjs` prueba la réplica. Android se compila por separado con `scripts/build-android.ps1`; las pruebas nativas requieren un dispositivo de ensayo o emulador funcional.
- Declarar por separado navegador, simulaciones, compilación y pruebas físicas. No afirmar compatibilidad física con HONOR/iPhone ni convivencia con la báscula sin evidencia real.

No repetir pruebas de fuentes sin cambios ni crear documentación duplicada. Actualiza `docs/ESTADO.md` con resultados, huellas y commits reales.

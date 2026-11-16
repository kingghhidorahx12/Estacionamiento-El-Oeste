# Cloudflare principal · El Oeste

Implementación `cloud/`, independiente de Java/Android y de la réplica `remote/`. El estado real, pruebas, versiones y bloqueos están en [ESTADO.md](ESTADO.md). Un solo Worker sirve API y recursos estáticos con D1 principal; sin KV monetario, Pages ni sincronización de doble autoridad.

## Correspondencia funcional

| Implementación anterior | Cloud principal |
|---|---|
| `Rules.java` | `lib/rules.mjs`; 1670 casos sintéticos producidos por Java, incluidos snapshots históricos |
| API/SQLite de la tablet | `worker.mjs`, `lib/api.mjs`, migraciones D1 versionadas |
| Entradas, cierres, lavados, extravío y cancelaciones | Transacción D1 con guardas de revisión, ocupación, tarjeta y usuario; auditoría y pago únicos |
| Identificador de solicitud | Registro `operations` con huella HMAC y resultado cifrado; consulta por clave y usuario |
| Usuarios/PIN | Hash compatible PBKDF2 SHA-256/210000; nombre visible conservado; roles, CSRF y navegador previamente autorizado |
| Tarjetas | Verificación por hash, copia recuperable AES-GCM en D1; impresión sólo administrativa; conservar códigos al importar |
| Mensualidades y temporal | Fechas/modos explícitos, snapshots y un pago por contrato; sin recargos inventados |
| Reportes/actividad/CSV | Pagos persistidos una sola vez, categorías y usuario; lectura de periodo mediante un batch consistente |
| Respaldo/restauración | Exportación cifrada independiente; importación controlada a D1 vacía/inactiva |
| Cliente/PWA/OCR | Adaptación de `web/` al compilar; mismos recursos EO, lector local y entrada por placa; fotos sólo en RAM |
| USB/LAN Android | Impresión del navegador; puente local opcional pendiente, sin acceso cloud directo a USB/9100 |
| Réplica financiera | Se conserva histórica, no alimenta la nueva autoridad ni permite operar por duplicado |

## Acceso propio, sin Zero Trust ni autenticador

El propietario retiró esos requisitos durante la implementación. Todos los roles necesitan PIN y cookie de un navegador autorizado. El servidor guarda únicamente el hash del token aleatorio de 256 bits. No se usa una IP como identidad, por lo que cambiar Wi-Fi/datos no invalida una sesión. No es una comprobación física del teléfono.

Primera instalación: enlace privado de un uso y una hora, emitido con las credenciales Cloudflare del propietario. Éste elige usuario/PIN; se autoriza ese navegador. No publicar el enlace. En ensayo, debe confirmar expresamente que son datos nuevos de prueba; no se importan ni sustituyen QR de la tablet.

Otro teléfono: usuario/PIN → solicitud con código → administrador abre **Equipo → Teléfonos autorizados**, comprueba el código en el teléfono y autoriza. El empleado pulsa Entrar de nuevo. Los navegadores autorizados usan sólo usuario/PIN. Se puede retirar el acceso desde Equipo. Las solicitudes vencen en 15 minutos; la cookie tiene máximo de un año, sin bloqueo por inactividad. La sesión conserva el máximo absoluto de 12 horas. Borrar cookies, usar otro perfil/PWA o retirar la autorización puede requerir aprobar otra vez.

Cookies HttpOnly/Secure/SameSite, comprobación de origen/JSON, CSRF, autorización en servidor, límites por cuenta/red y revocación de sesiones al cambiar acceso/PIN. No se registran cuerpos, placas, PIN, cookies ni errores SQL crudos. Una sesión robada sin su cookie de navegador no autoriza API. No afirmar protección de passkey, hardware o resistencia a phishing.

## Desplegar el ensayo existente

Cuenta exclusiva `54600c17d459514351dc3e040a7271cf`; Worker `el-oeste-ensayo`; D1 `d7552046-59b3-4236-b91c-ed9a904f064c`. URL: [ensayo HTTPS](https://el-oeste-ensayo.el-oeste-kingghidorahx12.workers.dev). Sin datos operativos al preparar esta entrega. No crear recursos en cuentas globales de otros proyectos.

Desde la raíz, con Node 24:

```powershell
cd cloud
npm ci
node scripts/wrangler.mjs login --scopes account:read workers:write workers_scripts:write d1:write
node scripts/wrangler.mjs d1 migrations apply el-oeste-ensayo --remote --env staging
node scripts/secrets.mjs
node scripts/wrangler.mjs secret bulk ../.dev/cloud-secrets.json --env staging
npm test
npm run deploy:staging
```

El wrapper utiliza `.dev/cloudflare-auth`, separado del perfil Wrangler global. No imprime tokens. `DATA_KEY` cifra QR/resultados y `REQUEST_KEY` protege huellas de solicitudes. Conservar copia privada de ambas; `secrets.mjs` no las sobrescribe ni rota al existir.

Para preparar el acceso del propietario, después de verificar el servidor y elegir instalación nueva de ensayo o recuperación del administrador existente:

```powershell
node scripts/prepare-setup.mjs
node scripts/wrangler.mjs secret bulk ../.dev/cloud-secrets.json --env staging
```

Abrir `.dev/iniciar-el-oeste.html` y pulsar su botón o escanear su QR desde el teléfono; la URL también está en `.dev/cloud-setup-link.txt`. El fragmento se retira del historial de la página y no se envía en la petición HTTP inicial. El token sólo se presenta por POST HTTPS; se marca consumido dentro de la misma transacción que crea el acceso. Si venció, se emite otro. Una base existente conserva sus usuarios, PIN, tarifas, tarjetas y pagos; el enlace permite autorizar el navegador del administrador existente comprobando también su PIN.

No generar enlaces con credenciales por defecto, publicar `.dev`, ni iniciar una instalación nueva sobre datos reales. No se ha configurado un destino de producción ni se ha autorizado el corte definitivo.

## Atomicidad, reintentos y desconexión

`Store` usa sesión D1 `first-primary`. Un batch contiene identificador único, guardas condicionales, pago/estancia/tarjeta y auditoría. Las guardas CHECK abortan todo el batch si cambió una revisión o autoridad. Restricciones únicas impiden dos estancias activas por tarjeta y dos pagos por estancia/contrato; un trigger limita a 30 vehículos. Los pagos cerrados no admiten UPDATE/DELETE.

Timeout/503 no significa éxito ni fracaso. El cliente consulta `/api/operation` por la misma clave y usuario. Sólo confirma el resultado persistido; si no aparece, conserva la clave para reintentar. El sobre de reintento del cierre no es una cola local de pagos ni un importe que se presente como actual. Credenciales, fotos, QR y formularios de vehículo no se guardan en ese almacenamiento. Los formularios no monetarios permanecen en RAM; recargar puede perderlos.

Sin conexión se ocultan los importes previos, se impide confirmar entradas/cierres y se ofrece reconectar. La PWA sólo almacena shell, fuentes, imágenes públicas y OCR, nunca `/api/` ni fotos. Su caché cambia con la huella de los recursos; conserva separado el cliente local histórico.

Caída total de Internet: usar un registro manual físico con tarjeta/placa, horas observadas, operador y recibo identificable. Ninguna operación manual se considera ya confirmada en D1. Al volver Internet, el administrador concilia con estancias, pagos e identificadores antes de registrar lo faltante. No arrancar automáticamente Android como segunda autoridad ni estimar recargos. Se requiere acordar ese procedimiento operativo con el negocio.

## Migrar o recuperar datos reales

1. Respaldar desde Android con contraseña privada, identificar si los datos son reales o de ensayo y conservar la instalación recuperable. No usar una muestra como datos reales.
2. Preparar D1 vacía e inactiva. El ensayo actual no es el destino de producción. Configurar un destino de producción separado antes del corte, con sus Secrets y límites autorizados.
3. Convertir en esta computadora, nunca subir el respaldo a assets:

```powershell
node scripts/migrate.mjs --input=RUTA_COPIA.oeste --mapping=RUTA_PRIVADA.json --password-file=RUTA_PRIVADA.txt --secrets=../.dev/cloud-secrets.json --out=../.dev/cloud-import
```

La correspondencia privada declara `sourceKind` como `real` o `synthetic`. Se conservan IDs, hash de PIN, estancias/snapshots, contratos, pagos, auditorías y secretos QR. Un inventario de 35 se amplía a 60 sin rotar los originales. No se importan sesiones ni autorizaciones de navegador. La salida SQL queda privada y con autoridad `inactive`; no conecta ni activa por sí misma.

4. Revisar el SHA del respaldo y SQL, conteos, versiones, categorías, saldo, ocupación y estados. Aplicar SQL solamente a la D1 vacía seleccionada. Un import fallido permanece inactivo; no repetir encima de una importación parcial ni borrar datos del origen para arreglarlo.
5. Conciliar con `verify-import.mjs --expected=... --out=...` en el destino configurado. El script actual apunta expresamente al ensayo; adaptarlo y revisar el ID antes de preparar producción. Un saldo coincidente no reemplaza revisar IDs y pagos posteriores.
6. Congelar las escrituras Android, anotar hora/último pago y obtener respaldo final. Reconvertir/importar ese corte final a destino vacío; verificar otra vez y autorizar el navegador del administrador existente mediante enlace privado. No cambiar sus QR ni pedir nuevo PIN.
7. Sólo tras aprobación del corte, verificación y suspensión de escrituras locales, cambiar `meta.authority` de `inactive` a `cloud-active` en producción y registrar la decisión administrativa. `cloud-test` sirve únicamente al ensayo. La API comprueba ese valor dentro de cada transacción.
8. Conservar respaldo previo/final y claves privadas fuera del servidor. Probar restauración a otra D1 vacía; no reemplazar pagos posteriores desde el navegador. [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) complementa la copia independiente; revisar su ventana del plan vigente.

Reversión: antes de nuevos movimientos cloud puede reabrirse exclusivamente el origen intacto y cerrar cloud. Si hubo movimientos cloud, detenerlo primero, exportar/conciliar todos sus pagos y estancias posteriores al corte, resolver administrativamente las diferencias y sólo entonces decidir el único destino. Nunca restaurar un respaldo viejo sobre cobros nuevos ni sumar dos históricos del mismo pago. No existe sincronización inversa automática.

## Pruebas, medición y límites

`npm test` prepara assets/bundle y ejecuta las pruebas nuevas. La paridad usa un fixture Java sintético comprimido, no datos reales. Para regenerarlo tras cambiar Rules: `scripts/java-vectors.ps1 -JavaHome RUTA_JDK_21`, con `.dev/lib/json.jar` obtenido por el descargador del proyecto. No repetir Java/Android/réplica sin cambios.

Separar Node/SQLite simulado, workerd/D1 local, URL real y pruebas físicas. workerd local permite parámetros que Cloudflare público puede limitar: una prueba local de PBKDF2 no demuestra admisión ni CPU facturada en la nube. La API nativa pública rechazó 210000 iteraciones aunque workerd local las admitía. Se usa @noble/hashes 2.4.0 (MIT), sólo en el servidor, para conservar exactamente PBKDF2 SHA-256/210000 tanto en PIN como en respaldo. La comparación con Node nativo y el formato Java se conserva; no se redujeron iteraciones. Verificar inicio de sesión y respaldos en el proveedor antes de habilitar operación real.

Medición local orientativa del Worker completo: entrada 14 consultas/27 filas leídas/19 escritas; cierre 13/23/22; reintento ya confirmado 2/4/0; estado con un pago 9/70/0. Son metadatos de D1 local, no facturación real. `EXPLAIN QUERY PLAN` confirma `payments_actor_time`. Simulación de 500 vehículos: 1,884,160 bytes SQLite, alrededor de 3.8 KB por vehículo incluido el coste fijo, sin copias históricas acumuladas. No extrapolar como garantía de tamaño D1.

Estimación de volumen con 50 vehículos/día, dos personas y ocho horas activas: unas 40000–50000 invocaciones/mes, incluyendo refrescos, escaneo, operaciones y assets que pasan por Worker; unos 65000–100000 cambios de filas/mes antes de respaldos. Las consultas de estado y periodos dependen de datos reales. La actualización automática se limita a pestañas visibles con actividad reciente; detener el refresco no cierra la cuenta.

[Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) tiene 100000 peticiones/día y 10 ms de CPU por invocación. Paid parte de US$5/mes con 10 millones de peticiones y 30 millones de ms CPU incluidos; revisar consumo real, impuestos y otros productos. Para este volumen la estimación Paid es la cuota base si entra en lo incluido; no es una cotización ni un plan contratado.

[D1 Free](https://developers.cloudflare.com/d1/platform/pricing/) incluye 5 millones de filas leídas y 100000 escritas al día, con 5 GB totales; sus límites no garantizan que la autenticación entre en la CPU Free. Los respaldos cifrados guardados para recuperar respuestas consumen también D1; aún no hay una política de retención confirmada.

Preparado para decidir, **sin activar**: en Paid, límite CPU inicial de 1000 ms/invocación después de medir p95; alerta de uso al 50/80/100 % del presupuesto autorizado y [límite de gasto Workers](https://developers.cloudflare.com/workers/platform/spend-management/) propuesto de US$1 adicional a la suscripción. Ese límite es de cuenta, puede interrumpir todos sus Workers y no cubre otros productos; no aplicarlo sin aprobación y revisión del alcance. Si las cuotas detienen la API, falla cerrada y conserva la consulta de resultados pendientes.

Observabilidad: `METRICS=safe` emite sólo categoría de operación, estado, tiempos y contadores; está apagado normalmente. Usar Analytics para CPU y errores/cuotas, evitando registrar URL completa, cuerpos, identidad o excepciones crudas. No se ha contratado un plan ni aprobado un gasto para esta migración.

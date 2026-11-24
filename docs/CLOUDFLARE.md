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

Cuenta exclusiva `54600c17d459514351dc3e040a7271cf`; Worker `eloeste`; D1 `d7552046-59b3-4236-b91c-ed9a904f064c`. URL: [ensayo HTTPS](https://eloeste.estacionamiento.workers.dev). Sin datos operativos al preparar esta entrega. No crear recursos en cuentas globales de otros proyectos.

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

`Store` usa sesión D1 `first-primary`. Un batch contiene identificador único, guardas condicionales, pago/estancia/tarjeta y auditoría. Las guardas CHECK abortan todo el batch si cambió una revisión o autoridad. Restricciones únicas impiden dos estancias activas por tarjeta y dos pagos por estancia/contrato; un trigger limita a 60 vehículos. Los pagos cerrados no admiten UPDATE/DELETE.

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


## Controles de entrega · 17/11/2026

Desde **Equipo → Dispositivos**, el administrador aprueba o rechaza solicitudes de ingreso con usuario/PIN, cotejando el código del navegador nuevo. La lista distingue «Este navegador», muestra fecha/referencia y permite nombrar o retirar otros accesos. Dos autorizaciones con el mismo nombre no acreditan que sean el mismo teléfono físico; no se fusionan automáticamente.

**Equipo → Eliminar** retira el acceso del empleado u otro administrador y sus autorizaciones, conservando su identidad para los movimientos históricos. No elimina la cuenta en uso ni permite perder el último administrador activo. Para transferir la administración, crear primero el administrador del cliente, autorizar su navegador y entrar con esa cuenta antes de eliminar el acceso anterior.

## Acceso e interfaz vigentes · 20/11/2026

Por aclaración posterior del propietario, Aplicación conserva dos opciones: Actualizar aplicación y Reiniciar datos. Se retiran las referencias visibles a entrega, ensayo y pruebas, sin retirar la función de reinicio. Reiniciar datos muestra un resumen y exige LIMPIAR más PIN administrativo; conserva configuración, usuarios, accesos, códigos QR y bloqueos. Incluye visitas, cobros de estacionamiento y baños, y pensiones. Si no hay datos elegibles, la opción sigue visible deshabilitada. El procedimiento conserva sus restricciones internas de instalación/autoridad/origen de datos; restaurar el botón no autoriza ejecutarlo ni activa producción.

Aplicar `0006_login_identifier.sql` y `0007_current_login_uniqueness.sql` antes de publicar esta versión. `users.login_name` identifica el acceso actual, con unicidad normalizada; `users.name` conserva la identidad histórica de pagos y auditoría. La unicidad y la búsqueda de acceso excluyen cuentas eliminadas: su identidad e historial permanecen, sin bloquear el renombrado de una cuenta vigente. El formulario ofrece un solo campo «Usuario»: guarda el nombre mostrado y su acceso normalizado juntos. Para pantallas anteriores, un cambio de `displayName` sin `loginName` también actualiza el acceso; un nombre inválido rechaza todo el cambio, incluido el PIN. Cambiar el usuario o PIN propio conserva la sesión desde la que se guarda y cierra las otras; la aprobación de navegador y los límites de sesión siguen vigentes. Cambios de permisos o desactivación mantienen su cierre de sesiones.

El HTML referencia los controladores y estilos con la misma revisión de interfaz. El service worker Cloud se mantiene separado del histórico, usa sólo su caché vigente y avisa a las pantallas de una revisión nueva; la recarga espera a que no haya formulario abierto ni operación en curso. Una pantalla que ya estaba abierta antes de incorporar este mecanismo necesita recargarse una vez. No borrar almacenamiento, cookies o autorizaciones para actualizarla.

La recuperación administrativa excepcional se hace con el perfil OAuth aislado, objetivo identificado y guardas de revisión, manteniendo id e historial. El PIN sólo se introduce en memoria del proceso; se deriva con PBKDF2 SHA-256/210000 y nunca se incorpora al repositorio, a registros o al HTML. Se comprueba el lote y su rollback antes de la actualización y se verifica el acceso en Cloudflare real. Referencia del formato de lote de consultas: [API oficial de D1](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/).

El cliente Cloud usa `cloud/ocr.js` y `cloud/ocr-camera.js`; el build los integra expresamente. Mantiene el modelo fast incluido, prioriza la placa sobre textos secundarios y devuelve únicamente letras y números, incluso cuando la matrícula aparece partida en renglones. La captura nativa devuelve una foto para recorte central y revisión; la segunda lectura está acotada. La foto nunca se transmite y la lectura siempre se revisa. La comprobación de navegador con imágenes ficticias no acredita una cámara física.

## Catálogo, pensiones y cuentas · 23/11/2026

**Resumen → Tarifas** abre por servicio: Estacionamiento, Lavados, Pensiones, Baños, Eventos y los servicios fijos configurados, incluido Extravío. También reúne Tipos de vehículo, Clientes y Agregar servicio. Dentro de cada servicio, las pestañas filtran los precios por tipo de cliente. El administrador agrega, modifica y elimina servicios, tipos de vehículo y tipos de cliente; Eliminar los retira de nuevas operaciones conservando identificadores e historial. Aplicar al catálogo prepara el cambio y Guardar cambios lo confirma. Normal permanece activo como precio base. Los servicios nuevos usan un tipo de cobro existente: hora, tiempo libre, lavado, pensión por periodo, mensualidad, baños o servicio fijo/complemento. Una fórmula comercial diferente requiere implementación y confirmación; un nombre o precio nuevo no requiere código. Las dependencias impiden retirar la última tarifa horaria o una pensión que siga seleccionada para noche/vencimiento.

Clientes, dentro de Tarifas, administra tipos como Normal, Preferencial y Presidencia, además de los nuevos que se necesiten. No sustituye la lista de personas de Presidencia en Clientes y saldos. Los tipos nuevos heredan los precios de Normal hasta que se ajusten por servicio; su cálculo horario se elige explícitamente. Agregar un tipo no concede crédito: registrar a cuenta sigue limitado a Presidencia. Al eliminar un tipo se conservan las visitas abiertas y el acceso de los contratos mensuales pagados que siguen vigentes. Los desplegables muestran sólo tipos activos, en orden alfabético, y mantienen Normal como selección inicial.

Los cambios crean una versión para entradas futuras. Las estancias anteriores conservan su instantánea. Cada lavado permite estacionamiento incluido, complemento opcional o sin estacionamiento; las modalidades iniciales ofrecen el complemento opcional de $30. Moto cuesta $100. La jornada utiliza apertura/cierre configurados, no 24 horas implícitas. Por aclaración posterior del propietario, Baños cuesta $7 para todos y tiene sección propia en Tarifas. Su único precio se comparte entre las pestañas de cliente, sin diferencias de perfil o evento. Presidencia mantiene hora de $10 y tiempo libre de $35. Los otros precios de ese perfil muestran explícitamente si heredan Normal.

En Estacionamiento → Horario y cierre se configuran apertura 07:00, cierre 20:00 y pensión nocturna. En Pensiones → Vigencias y saldo vencido se configuran el aviso de mensualidad, inicialmente tres días antes, y las pensiones para vencimiento. Los valores son editables. Por confirmación del 24/11/2026, la noche y la pensión temporal de 12 horas normales cuestan $70; la temporal de 24 horas queda en $80 provisional. Las mensualidades son $600 con 12 horas por visita y $700 con 24 horas por visita, contadas desde cada entrada. El contrato sigue cubriendo 30 días exactos desde su fecha/hora de inicio. Los tipos de vehículo son un filtro opcional, sin diferencias de precio inventadas por tamaño. En Editar servicio se pueden modificar las horas incluidas por visita y el indicador Precio provisional. Registrar sin pago conserva un contrato pendiente, sin habilitar cobertura. Presidencia puede recibir crédito autorizado explícitamente.

El vencimiento conserva el importe inicial. Cada bloque adicional comienza con la pensión corta y pasa a la larga al rebasar la duración corta; el siguiente bloque vuelve a comenzar. La base mensual pagada no se repite ni se convierte en estacionamiento horario. En una visita mensual nueva, la cobertura termina al alcanzar sus horas incluidas o la fecha/hora de fin del contrato, lo que ocurra primero. Después se acumula saldo vencido de pensión con las reglas guardadas, sin sustituirlo por tarifa horaria. La siguiente entrada de un contrato vigente comienza su propio contador de horas. Las visitas y los contratos anteriores conservan su instantánea; no se les añaden límites de visita retroactivos. En estacionamiento por hora/tiempo libre, después del cierre se añade la pensión nocturna; al abrir se cobra por hora, sin solapar periodos. La resolución administrativa permite reducir el importe con motivo y autorización, conservando el original en auditoría.

Eventos permite configurar precios por cliente y cierre, inicialmente 03:00 del día siguiente. Activar modo evento está en Resumen y utiliza los precios guardados; no guarda otro borrador de tarifas. Activar fija el inicio con hora del servidor: sólo entradas posteriores reciben los precios de evento. Las anteriores conservan precio y reciben la ampliación de cobertura. Finalizar el modo desde Resumen detiene su aplicación a nuevas entradas y conserva la cobertura ya concedida. Se puede reactivar el mismo día conservando la cobertura anterior; un diálogo antiguo no puede finalizar una fase reactivada.

**Clientes → Agregar persona** registra nombre y placas de Presidencia. Al ingresar una placa asociada se preselecciona persona/perfil antes del servicio; el empleado confirma. Cerrar a cuenta libera estancia y tarjeta, sin contabilizar ingreso. Los abonos parciales se asignan a cargos pendientes en orden; sólo el dinero efectivamente recibido entra en reportes, atribuido a quien cobra. Un contrato con abonos muestra el saldo restante antes de completar su pago.

**Clientes y saldos → Ver cuenta → Anular cargo** permite a un administrador retirar un cargo de servicio a cuenta que no tenga ningún abono, con motivo obligatorio y confirmación. Cancelar vuelve a la cuenta sin modificar el saldo. El cargo deja de estar pendiente y aparece en Cargos anulados, con importe original, motivo, fecha y responsable. No registra ingreso ni borra la estancia cerrada, el cliente o pagos existentes. No anula mensualidades ni cargos con abonos: requieren su gestión específica. La base también impide pagar un cargo anulado y anular un cargo que ya recibió un abono; el lote decide de forma transaccional cuando coinciden ambas acciones.

Aplicar `0009_charge_voids.sql` antes del Worker que incorpora esta opción. Es aditiva; añade anulaciones inmutables y sus restricciones. Respaldos, conciliación e importación incluyen esas filas. Tras anular un cargo no volver a una versión anterior que desconozca las anulaciones, pues mostraría un saldo incorrecto. El reinicio existente incluye estas filas conservando sus guardas y no se ejecuta por publicar esta función.

La migración aditiva `0008_catalog_accounts.sql` añade clientes, cargos, pagos recibidos, asignaciones y eventos. Aplicarla antes del Worker nuevo. El catálogo inicial se persiste como nueva versión mediante lote guardado; no reescribe visitas, pagos, usuarios ni tarjetas. Respaldos y conciliación incluyen las tablas nuevas. Reiniciar datos conserva clientes/configuración y mantiene sus guardas anteriores; publicar no autoriza ejecutarlo. Tras nuevos cargos o pagos no volver a un Worker que desconozca estas tablas: detener y conciliar antes de una reversión.

La entrada sigue tarjeta → placa → perfil/persona → tipo de vehículo → servicio filtrado y opciones → confirmar; elegir el número de tarjeta sólo abre el formulario. El acceso puede recordar nombres de usuarios autenticados en ese navegador, nunca el PIN. Aplicación incluye Comprobar dispositivo y compatibilidad para funciones ausentes en navegadores anteriores. Esto no acredita resolver el cierre nativo de la instalación en Moto e5 Plus/Android 8; falta comprobarlo en el teléfono, junto con la cámara. No se requiere borrar cookies, reinstalar certificados ni publicar una APK para esta actualización web.

Operación conserva Clientes y saldos centrado y el acceso directo a Baños; se retira el botón genérico Servicios de esa pantalla. Baños sólo pide cantidad y confirmar cobro, con alternativa Cancelar. Los demás servicios configurados se administran desde Resumen. Se retiraron de Resumen los botones duplicados de Operación y Baños; la pestaña Operación y su acceso a Baños permanecen. Las entradas registradas muestran una sola vez el número de tarjeta, grande a la izquierda de la placa/servicio, incluidos P01–P10; se retira de la etiqueta de cliente. Cancelar en un formulario de página navega fuera sin enviar el formulario; en un diálogo lo cierra. Anchos de formularios y controles acotados, opciones distribuidas por ancho, encabezados centrados y placas/importes destacados.

QR ocupa el viewport completo, con video que cubre el área visible y detección recortada a esa misma área. No incluye el selector de número duplicado; permanece en Operación. Cerrar libera el stream incluso si la autorización de cámara llega tarde. Leer foto abre directamente la captura nativa mediante un input de imagen con `capture="environment"`; después muestra recorte, OCR y campo de revisión. Imagen, canvas y URL blob permanecen locales y se liberan al terminar/cancelar. La apertura concreta de la cámara nativa depende del navegador y debe verificarse en el teléfono físico.

Corrección de horario heredado: al crear un catálogo nuevo se aplica el horario confirmado 07:00–20:00, en lugar de importar el cierre de una configuración anterior de prueba. Un catálogo ya configurado conserva sus horarios editados. El cierre heredado 12:59 provocaba que entradas de la tarde se calcularan como pensión nocturna. La instalación actual se corrigió por versión y se repararon únicamente cinco estancias abiertas con ese horario exacto, manteniendo servicio, precios y entrada, con revisión y auditoría transaccionales. Los pagos cerrados no se reescriben: existe un caso de revisión administrativa documentado en ESTADO.

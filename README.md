# Estacionamiento El Oeste

Aplicación para entradas, salidas, cobros en efectivo, lavados, pensiones y tarjetas reutilizables. La nueva implementación usa **Cloudflare Workers + D1 principal + Static Assets**, con HTTPS desde teléfonos o navegador. El código está en `cloud/`. El entorno de ensayo está publicado; inicialización privada, validación del proveedor y transición de datos deben completarse antes de operar. No requiere Zero Trust ni aplicación autenticadora. Consulta [despliegue y corte](docs/CLOUDFLARE.md).

Java/Android (`mx.eloeste.servidor`) y la réplica de consulta `remote/` permanecen como implementación histórica, separada de cloud. No se deben operar los mismos movimientos desde ambos servidores. Esta migración no publica una APK ni cambia el canal Android.

El proyecto conserva el motor y la persistencia desarrollados inicialmente. El estado de verificación y los límites de la entrega están en [docs/ESTADO.md](docs/ESTADO.md).

## Operación

1. Ingresar con usuario y PIN personal de 6 a 12 dígitos. En cloud, el administrador autoriza una vez cada navegador desde **Equipo → Teléfonos autorizados**, comprobando su código de solicitud. Después se usa sólo usuario/PIN. El primer administrador se prepara mediante un enlace privado de un uso; no hay credenciales predeterminadas ni aplicación autenticadora. Si se borran las cookies o cambia el navegador, se requiere nueva autorización.
2. **Escanear tarjeta:** si está libre abre el ingreso; si está asignada abre la salida. **Usar número** ofrece la misma identificación sin cámara. Escanear no registra entradas ni cobra por sí solo.
3. **Ingreso:** registrar sólo la placa, manualmente o con «Leer placa con foto», y confirmar la entrada. «Servicio y opciones» conserva tiempo libre, cliente preferencial, lavados y pensiones; sólo el lavado exige seleccionar el tipo para aplicar su tarifa. Sin placas, registrar una seña particular en las opciones. No se inventan marca, color ni tipo.
4. **Salida:** comprobar placa y tarjeta, revisar el total y pulsar **Confirmar pago y cerrar**. No se pide efectivo recibido ni se calcula cambio en esta salida. El servidor recalcula y exige volver a confirmar si el importe cambió; la transacción registra un único pago. Una cobertura pendiente sigue necesitando revisión administrativa: el administrador puede autorizar expresamente el importe base sin cargo adicional, sin teclear importe ni motivo; la decisión y la incidencia quedan auditadas.
5. **Cancelaciones:** una entrada activa o un lavado pendiente requieren autorización de administrador y motivo. El empleado solicita usuario/PIN del administrador dentro de la operación; no cambia de usuario. El registro se conserva en auditoría; no se borran pagos cerrados.
6. El administrador entra a su resumen del negocio; el empleado a vehículos y escaneo. **Mi actividad** muestra únicamente sus cobros. **Equipo** concentra usuarios y permisos, conserva mayúsculas del nombre visible y permite desactivar accesos manteniendo su historial.

Los desplegables se ordenan por su texto en español, con números en orden natural. Se conserva la selección y el valor real; el aviso «Selecciona…» permanece arriba. Administración distribuye sus accesos en dos columnas en celular, tres en tablet intermedia y cuatro en escritorio. Las acciones de los diálogos se agrupan por propósito y conservan objetivos táctiles de al menos 48 px.

### Imprimir las 60 tarjetas

Administración → **Tarjetas** → **PDF carta** o **Imprimir**. Son ocho hojas carta verticales, ocho tarjetas por hoja, con guías de corte. Cada tarjeta mide **85.60 × 53.98 mm**, tamaño bancario ID-1. El QR ocupa la mitad izquierda; a la derecha van marca, nombre, número, únicamente tarifas normales y reglas, incluido el importe por extravío vigente en la configuración. No aparecen precios preferenciales en las tarjetas. Hay 50 normales (01–50) y 10 provisionales (P01–P10). Las provisionales usan identificadores internos 51–60 y no alteran tarifas ni capacidad.

En la impresora elegir **Carta y 100 % / Tamaño real**, sin «Ajustar a página»; si se imprime desde el navegador, quitar sus encabezados/pies. Los PDF mantienen QR vectoriales y cuatro módulos blancos de margen. No regeneran los códigos: utilizan los 60 de esa instalación, sin cambiar los QR anteriores. No compartir el PDF públicamente. Al cambiar tarifas o reemitir un QR, volver a imprimir las tarjetas afectadas.

No hay bloqueo por inactividad en las cuentas ni en el mantenimiento nativo. Continúan disponibles Cerrar sesión y Bloquear configuración de forma manual. El máximo absoluto de sesión existente de 12 horas y las autorizaciones por PIN para acciones administrativas se conservan; son independientes de la inactividad y del bloqueo de pantalla de Android.

### Configurar la impresora térmica

En cloud, **Resumen del negocio → Periféricos** explica la impresión mediante el navegador y el diálogo del sistema. Tarjetas y comprobantes conservan sus datos; imprimir no vuelve a cobrar. AirPrint, servicio Android o controlador de escritorio dependen de la impresora instalada y requieren ensayo físico. Cloudflare no abre USB ni el puerto LAN de la impresora. Un puente local sería opcional y separado.

**Sólo servidor Android histórico:** el formato de partida es **80 mm, 48 caracteres, ESC/POS, sin acentos, página 0 y ocho líneas finales**. También permite 58 mm, codificación y cortador configurables. No importa preferencias privadas de El Muelle; la IP y el dispositivo se eligen en esta instalación.

- **LAN:** conectar impresora y tablet a la misma red, registrar la IP de la impresora y su puerto (normalmente 9100), guardar, comprobar conexión y después imprimir una prueba. La comprobación TCP no mueve papel.
- **USB:** elegir una impresora detectada y guardar. En la tablet abrir **El Oeste · Servidor → Administración → Periféricos → Autorizar impresora USB elegida** y confirmar el diálogo de Android. Después imprimir la prueba. Se muestran interfaces de impresora, no básculas. No se fuerza la liberación de una interfaz ocupada por otra app; LAN permite evitar esa disputa si el equipo la admite.
- **Comprobantes:** el historial de pagos ofrece imprimir una copia del pago existente. El empleado sólo imprime sus cobros. No vuelve a cobrar ni cambia el reporte. Si falla o no queda confirmado el envío, revisar papel y conexión antes de reenviar; no hay reintento automático de impresión.

Las pruebas con transportes simulados no acreditan compatibilidad física, corte, acentos o convivencia con El Muelle. La impresión física debe verificarse con la impresora real, sin cambiar sus permisos ni la báscula de El Muelle.

La fotografía vuelve al lector local dedicado sólo a placas de la versión 0.7: recorte central, alfabeto de placas y modelo fast local. La segmentación se ajusta a una sola línea de placa; la guía coincide con el recorte tanto en vídeo vertical como horizontal. La lectura propuesta es editable antes de aplicarla. No intenta identificar color ni marca. Las fotografías permanecen sólo en RAM del teléfono; no se envían a la tablet, terceros o Cloudflare ni se guardan en caché. Se mantiene preparación anticipada, límite de espera, reintento, cancelación y captura manual. La rapidez y precisión de cámara real siguen pendientes de prueba física.

La ampliación de tarjetas agrega únicamente los números que faltan. Conserva secretos, estados administrativos, estancias y pagos existentes. Por eso una reserva o suspensión previa sigue requiriendo la decisión del administrador. Se aceptan respaldos cifrados completos de 35 y 60 tarjetas; al restaurar uno anterior se agregan los nuevos códigos dentro de la transacción. La capacidad continúa en 30 vehículos.

## Tarifas iniciales

| Modalidad | MXN |
|---|---:|
| Hora normal | $15 |
| Cliente preferencial: hora iniciada, sin fracciones | $10 |
| Tiempo libre normal / cliente preferencial | $50 / $40 |
| Lavado de auto | $120 |
| Lavado de camioneta / Van | $170 |
| Lavado de pickup | $200 |
| Complemento de jornada, exclusivamente con lavado | +$30 |
| Mensual nocturna de 12 horas | $500 por mes |
| Mensual de 24 horas | $600 por mes |
| Temporal provisional de hasta 12 horas desde el ingreso | $100 |
| Extravío de tarjeta | +$100 |

La casilla **Cliente preferencial** selecciona únicamente $10 por hora iniciada o $40 por tiempo libre. La tarifa normal se calcula automáticamente; no se ofrecen controles de fracciones ni tolerancia al empleado. Los cambios de configuración se aplican a nuevas entradas. Las estancias ya abiertas conservan su versión y los pagos cerrados no se recalculan.

Tiempo libre y complemento de lavado son conceptos separados; durante su cobertura no se suma tarifa horaria. El tiempo libre de cliente preferencial es de $40. Lavado solo conserva su precio base; no hay tarifa confirmada de lavado para motos.

La jornada **no equivale automáticamente a 24 horas**. Apertura/cierre e inicio/fin nocturno comienzan sin definir. Un administrador puede configurarlos explícitamente. Fuera de cobertura o sin horario confirmado se exige resolución administrativa justificada; no se inventan excedentes. Las mensualidades usan fechas de inicio y vencimiento explícitas, pago pendiente o confirmado, y no se renuevan automáticamente. Una pensión pagada registra cada visita y su ocupación sin crear otro ingreso por la misma mensualidad.

Cada estancia conserva la versión de tarifas al ingresar. Los reportes cuentan pagos confirmados, distinguen modalidades y empleados y permiten CSV y comparación por periodo. En cloud, las operaciones requieren Internet. Si falla, se conserva el formulario en memoria, se ocultan importes anteriores y se consulta el resultado pendiente al reconectar. Un reintento usa el mismo identificador; no se fabrica un pago local.

## Desarrollo y pruebas en Windows

Cloud (Node 24): `cd cloud`, `npm ci`, `npm test`. Las pruebas incluyen paridad con Java, transacciones concurrentes, seguridad, migración y Worker completo en workerd/D1 local. [Guía técnica](docs/CLOUDFLARE.md). El perfil Wrangler es exclusivo de El Oeste.

Los siguientes comandos corresponden a la implementación Java/Android histórica:

Requiere Python 3, Node para comprobar JavaScript, JDK 21 y, para APK, Android SDK 35 / Build Tools 35.0.0. Node y Python son herramientas de desarrollo; la tablet ejecuta Java nativo, sin un runtime Node adicional.

```powershell
python scripts/download-deps.py
python scripts/download-ocr.py
./scripts/build.ps1 -JavaHome C:/ruta/jdk-21 -Test
node --test tests/remote.test.mjs tests/remote-integration.test.mjs
./scripts/start.ps1 -JavaHome C:/ruta/jdk-21
```

El primer arranque solicita usuario y PIN; no hay acceso predeterminado. La base de desarrollo se guarda en `data/oeste.sqlite`, excluida de Git. HTTP en `localhost:8787` sirve exclusivamente para desarrollo en esa computadora. El acceso de teléfonos por Wi-Fi utiliza HTTPS y certificados confiables.

```powershell
./scripts/build-android.ps1 -JavaHome C:/ruta/jdk-21 -AndroidSdk C:/ruta/sdk
```

La compilación genera una APK **de pruebas**, con clave de desarrollo local excluida de Git. Preparar una firma de distribución propia y conservarla antes de una entrega de producción. No usar ni copiar la firma de El Muelle.

## Instalación histórica en HONOR Pad 8

Estas instrucciones corresponden exclusivamente al servidor local anterior. La URL cloud no necesita tablet, IP local ni instalar certificados. No iniciar ambos servidores sobre la misma operación.

[Descargar APK de pruebas 0.9.0 para la tablet](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/download/v0.9.0/El-Oeste-0.9.0-pruebas.apk).

1. Conectar la tablet al Wi-Fi del negocio e instalar la APK de pruebas 0.9.0 encima de la existente, conservando sus datos. No se requiere una computadora para generar certificados.
2. Abrir **El Oeste · Servidor**, crear el usuario administrador y su PIN. La app prepara automáticamente una CA y un certificado únicos para esa instalación. Las claves privadas se generan dentro de AndroidKeyStore y no se exportan ni vienen compartidas dentro de la APK.
3. Cuando indique **Activo**, pulsar **Conectar un celular**. Con el celular en el mismo Wi-Fi, escanear el QR, descargar `El-Oeste-CA.cer` y seguir la guía de autorización del teléfono. La pantalla de la tablet muestra la huella SHA-256 para comprobar que se instala su certificado correcto.
4. Abrir la dirección `https://IP-DE-LA-TABLET:8443`, entrar con usuario/PIN y agregarla a la pantalla de inicio. Autorizar la cámara al usarla. No omitir advertencias TLS.
5. Crear empleados desde **Resumen del negocio → Equipo** y obtener las 60 tarjetas en **Tarjetas → Descargar PDF carta**. Sus secretos nacen aleatoriamente en la instalación privada.

**¿Qué se ahorró?** La instalación habitual ya no necesita crear ni importar `server.p12`, instalar JDK en otra computadora o manejar una contraseña de certificado. La CA pública se obtiene directamente de la tablet. Los certificados importados en versiones anteriores se conservan; la importación externa sigue disponible dentro de Opciones avanzadas.

**¿Puede eliminarse `El-Oeste-CA.cer`?** En este diseño local, sin dominio público y operativo sin Internet, cada teléfono debe autorizar una vez la CA de la tablet para usar HTTPS y cámara. La aplicación no puede concederse esa confianza por sí misma. `El-Oeste-CA.cer` contiene sólo el certificado público, nunca la clave privada. No se deben instalar certificados de una fuente desconocida.

En iPhone: revisar e instalar el perfil y activar su confianza en **Ajustes → General → Información → Ajustes de confianza de certificados**. La [guía de Apple](https://support.apple.com/en-us/102390) explica esta autorización. En Android: **Ajustes → Seguridad → Instalar certificado → Certificado de CA**; el nombre del menú varía según fabricante y versión. Cada usuario realiza la autorización en su teléfono. Si el navegador no reconoce la conexión tras autorizarla, revisar certificado, fecha e IP; no desactivar su validación.

La guía de conexión usa temporalmente HTTP en el puerto 8788, con una ruta aleatoria y caducidad de 10 minutos. Sólo entrega instrucciones y la CA pública: no tiene API, cookies, PIN, vehículos ni cobros. Se cierra al salir de esa pantalla de la tablet. Como la descarga inicial no está autenticada por HTTPS, **comparar la huella del certificado con la pantalla física de la tablet antes de instalarlo**. La operación continúa exclusivamente en HTTPS, puerto 8443.

En la conexión automática, si cambia la IP del Wi-Fi, la app renueva el certificado del servidor conservando la misma CA; el enlace guardado en los teléfonos sí debe actualizarse. Se recomienda reservar la IP en el router para mantener estable el acceso. El Wi-Fi debe permitir comunicación entre sus dispositivos; no abrir estos puertos a Internet. La renovación local del certificado no requiere Internet. Los certificados externos importados siguen sujetos a su configuración y renovación manual. Desinstalar la app o borrar sus datos elimina su identidad local y exige preparar y autorizar una nueva instalación.

Eliminar la autorización manual requeriría otro esquema: dominio propio y certificado de una autoridad pública, con configuración de DNS y renovación por Internet. No está activado ni se supone contratado.

El servidor usa servicio en primer plano con notificación, recuperación `START_STICKY` y aviso tras reinicio. Android puede detener procesos: tras reinicio, cierre forzado o ahorro de energía, verificar el estado y reabrir la app si procede. No se cambian ajustes globales, permisos USB ni políticas de El Muelle. La prueba prolongada con El Muelle en primer plano y la báscula conectada permanece obligatoria antes de producción.

## Respaldo y restauración

**Cloud:** descarga cifrada independiente desde Respaldos. Restaurar requiere validar/importar a una D1 vacía e inactiva, conciliar y autorizar el corte; el navegador no sobrescribe pagos posteriores. Procedimiento en [CLOUDFLARE.md](docs/CLOUDFLARE.md). Conservar también las claves de servidor por un medio privado separado.

**Servidor Android histórico:**

Administración → **Respaldo y restauración** descarga un archivo `.oeste` comprimido y cifrado con AES-256-GCM; la contraseña independiente se deriva con PBKDF2. Incluye datos, usuarios con hashes, tarifas y tarjetas. Guardarlo fuera de la tablet y conservar su contraseña por un medio privado. No incluye sesiones ni fotografías.

Para restaurar: respaldar primero el estado actual, seleccionar la copia, introducir su contraseña, PIN de administrador y `RESTAURAR`. La sustitución se hace dentro de una transacción; un archivo alterado, una contraseña equivocada o inconsistencias dejan intacta la base. Se cierran las sesiones y se reconcilia la cola remota. Los certificados y el PIN nativo de configuración pertenecen a la instalación y no se transfieren mediante este respaldo. Esta versión limita el documento descomprimido a 32 MB y el archivo cifrado a 8 MB; para históricos mayores se requiere una ampliación de exportación por streaming.

## Réplica remota histórica y privacidad

Este apartado describe únicamente `remote/`. El servidor principal `cloud/` almacena los datos mínimos de vehículos necesarios para operar; las fotografías siguen sólo en RAM del teléfono.

[remote/](remote/) contiene Worker, esquema D1 y panel de consulta. Configuración en [docs/SINCRONIZACION.md](docs/SINCRONIZACION.md). No se ha supuesto un despliegue ni credenciales Cloudflare. La cola local persiste eventos de pago únicos con época y secuencia, reintenta con espera creciente y sólo confirma lotes reconocidos por el Worker. Las restauraciones abren otra época de secuencia para no colisionar con pagos remotos previos. El panel indica la última confirmación y datos atrasados.

No sincroniza placas, fotografías, marca, color, PIN, tokens QR ni notas de resolución. El panel valida Cloudflare Access; el PIN local no protege un panel financiero expuesto a Internet. Los límites de planes gratuitos pueden detener la réplica, sin detener la operación local.

## Código y licencias

- `core/`: tarifas, autenticación, API, respaldo y servidor HTTP(S) compartidos.
- `android/`: SQLite nativo, actividad de configuración, servicio y sincronización.
- `desktop/`: host de prueba con SQLite JDBC; no es un requisito para los teléfonos.
- `web/`: PWA, recursos locales, OCR y generador de tarjetas imprimibles.
- `tests/`: reglas, integración, seguridad y pruebas nativas separadas.

Iconografía y marca de El Oeste creadas para este proyecto; ilustración raster generada con image_gen. No incluyen activos comerciales de El Muelle. Tipografía Manrope bajo OFL; avisos y procedencia de terceros en [THIRD_PARTY.md](THIRD_PARTY.md).

## Actualización 0.3.1 · cierre de conexión desde Android

Si el celular instala la CA y abre la guía, pero el acceso al estacionamiento termina en `ERR_CONNECTION_CLOSED`, instalar la APK 0.3.1 **encima de la aplicación existente en la tablet**, abrir El Oeste · Servidor y activar la conexión. Conservar los datos de la aplicación. La actualización mantiene la CA local y los registros; renueva únicamente la clave/certificado del servidor con las autorizaciones de AndroidKeyStore que necesita TLS. El celular continúa usando la misma dirección y CA.

Antes de anunciar Activo, la conexión automática comprueba TLS 1.2 y TLS 1.3 con su proveedor real, validando CA y nombre de host en una prueba interna. Si falla, muestra un código TLS12/TLS13 para revisión. Las pruebas JDK no prueban por sí mismas el comportamiento de una HONOR física.

Referencia de la corrección: [KeyGenParameterSpec.Builder de Android](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.Builder#setDigests(java.lang.String...)) documenta las autorizaciones de digest y padding necesarias para claves TLS delegadas. La versión anterior no autorizaba DIGEST_NONE ni ENCRYPTION_PADDING_NONE en la clave de servidor.

## Usuarios y actualizaciones desde Internet · 0.4.0

Para incorporar el actualizador por primera vez, instalar la APK 0.4.0 encima de la existente **en la tablet**, abrir El Oeste · Servidor y activar la conexión. Se conserva la cuenta inicial, la base y la CA.

Para crear empleados: Administración → Reglas y equipo → Usuarios y permisos → Agregar usuario. Escribir usuario, PIN de 6 a 12 dígitos y permiso. La pantalla muestra Creando usuario mientras espera; un reintento con los mismos datos conserva el identificador. El PIN sigue usando PBKDF2 de 210,000 iteraciones; se reutiliza su verificador protegido para evitar una segunda derivación al registrar el mismo alta. Los PIN no se guardan en el almacenamiento del navegador.

Para futuras versiones: **Administración → Actualizar aplicación → Buscar y preparar actualización**. Puede solicitarlo un administrador desde un equipo conectado a la operación local. La tablet descarga de GitHub por Internet y, si existe una versión posterior, comprueba tamaño, SHA-256, paquete, versión, compatibilidad Android y la firma de la instalación actual. Después, abrir la notificación o El Oeste · Servidor y pulsar **Instalar actualización**. Android puede pedir autorizar a El Oeste como origen de instalación una vez y siempre presenta su confirmación. También se puede iniciar la búsqueda desde Actualizar aplicación en la app nativa.

La descarga terminada se conserva para continuar si Android cierra el proceso. Una solicitud administrativa permite abrir sólo esa instalación durante 30 minutos; no desbloquea el resto de la configuración ni se instala en silencio. Una actualización no borra datos ni cambia la CA. Sin Internet continúa la operación local; sólo la búsqueda/descarga necesita conexión externa. El panel Cloudflare sigue siendo de consulta y no recibe un canal de comandos hacia la tablet.

La APK de este canal es una versión de pruebas. La confirmación y la instalación nativas deben verificarse en los dispositivos reales antes de una distribución de producción.

Publicación del canal, para mantenimiento:

- Manifest público: `updates/latest.json`, servido desde la rama main del repositorio oficial. Identifica una única APK bajo Releases, con versión, versionCode, tamaño y SHA-256. No contiene claves ni datos de negocio.
- Publicar primero la APK verificada en la versión correspondiente de GitHub y actualizar el manifest sólo después de comprobar su descarga. El código fuente y los datos privados se mantienen separados de los binarios publicados.
- Conservar privadamente la misma clave de firma local. Una APK construida con otra firma se rechaza aunque el archivo venga del mismo repositorio. No publicar el almacén de claves ni copiar la firma de El Muelle.

La instalación con participación del usuario sigue el [flujo de instalación de Android](https://developer.android.com/reference/android/content/pm/PackageInstaller.SessionParams).

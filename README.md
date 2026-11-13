# Estacionamiento El Oeste

Aplicación local para entradas, salidas, cobros en efectivo, lavados, pensiones y tarjetas reutilizables. Servidor Android independiente: `mx.eloeste.servidor`. SQLite permanece en la tablet; la interfaz web se instala en iPhone y Android. La réplica Cloudflare es sólo de consulta.

El proyecto conserva el motor y la persistencia desarrollados inicialmente. El estado de verificación y los límites de la entrega están en [docs/ESTADO.md](docs/ESTADO.md).

## Operación

1. Ingresar con usuario y PIN personal de 6 a 12 dígitos.
2. **Escanear tarjeta:** si está libre abre el ingreso; si está asignada abre la salida. **Usar número** ofrece la misma identificación sin cámara. Escanear no registra entradas ni cobra por sí solo.
3. **Ingreso:** elegir marca y color en las listas; «Otro» permite escribir. Tipo, placas y servicio se confirman con el vehículo. Sin placas, registrar una seña particular. El lavado toma el precio del tipo seleccionado.
4. **Salida:** verificar físicamente el vehículo y confirmar efectivo. «Exacto» y los billetes sugeridos sólo llenan el importe; el servidor recalcula y registra un pago único al confirmar. Se muestra cambio y se vuelve al trabajo.
5. **Cancelaciones:** una entrada activa o un lavado pendiente requieren autorización de administrador y motivo. Un empleado puede pedir ese PIN dentro de la operación; no cambia de usuario. El registro se conserva en auditoría; no se borran pagos cerrados.
6. El administrador entra a su resumen del negocio; el empleado a vehículos y escaneo. **Mi actividad** muestra únicamente sus cobros. **Equipo** concentra usuarios y permisos, conserva mayúsculas del nombre visible y permite desactivar accesos manteniendo su historial.

### Imprimir las 35 tarjetas

Administración → **Tarjetas** → **Descargar PDF carta** o **Imprimir**. Son cinco hojas carta verticales, ocho tarjetas por hoja, con guías de corte. Cada tarjeta mide **85.60 × 53.98 mm**, tamaño bancario ID-1. El QR ocupa la mitad izquierda; a la derecha van marca, nombre, número, únicamente tarifas normales y reglas, incluido el importe por extravío vigente en la configuración. No aparecen precios preferenciales en las tarjetas. Los cinco números de reserva no se activan al imprimir.

En la impresora elegir **Carta y 100 % / Tamaño real**, sin «Ajustar a página»; si se imprime desde el navegador, quitar sus encabezados/pies. Los PDF mantienen QR vectoriales y cuatro módulos blancos de margen. No regeneran los códigos: utilizan los 35 de esa instalación. No compartir el PDF públicamente. Al cambiar tarifas o reemitir un QR, volver a imprimir las tarjetas afectadas.

No hay bloqueo por inactividad en las cuentas ni en el mantenimiento nativo. Continúan disponibles Cerrar sesión y Bloquear configuración de forma manual. El máximo absoluto de sesión existente de 12 horas y las autorizaciones por PIN para acciones administrativas se conservan; son independientes de la inactividad y del bloqueo de pantalla de Android.

### Configurar la impresora térmica

Toda la configuración está en **Resumen del negocio → Periféricos**. Requiere el servidor Android. El formato de partida corresponde al configurador de El Muelle: **80 mm, 48 caracteres, ESC/POS, sin acentos, página 0 y ocho líneas finales**. También permite 58 mm, codificación y cortador configurables. No importa preferencias privadas de El Muelle; la IP y el dispositivo se eligen en esta instalación.

- **LAN:** conectar impresora y tablet a la misma red, registrar la IP de la impresora y su puerto (normalmente 9100), guardar, comprobar conexión y después imprimir una prueba. La comprobación TCP no mueve papel.
- **USB:** elegir una impresora detectada y guardar. En la tablet abrir **El Oeste · Servidor → Administración → Periféricos → Autorizar impresora USB elegida** y confirmar el diálogo de Android. Después imprimir la prueba. Se muestran interfaces de impresora, no básculas. No se fuerza la liberación de una interfaz ocupada por otra app; LAN permite evitar esa disputa si el equipo la admite.
- **Comprobantes:** el historial de pagos ofrece imprimir una copia del pago existente. El empleado sólo imprime sus cobros. No vuelve a cobrar ni cambia el reporte. Si falla o no queda confirmado el envío, revisar papel y conexión antes de reenviar; no hay reintento automático de impresión.

Las pruebas con transportes simulados no acreditan compatibilidad física, corte, acentos o convivencia con El Muelle. La impresión física debe verificarse con la impresora real, sin cambiar sus permisos ni la báscula de El Muelle.

Una fotografía se mantiene temporalmente en un canvas del teléfono. El OCR se ejecuta con recursos locales; propone una lectura editable de placa. Marca y color se confirman manualmente: no se simula un modelo que no existe. Se liberan cámara, canvas y worker al confirmar, cancelar o salir. La aplicación no escribe fotografías ni las envía al servidor; el navegador o sistema operativo puede mantener memoria temporal fuera del control de la aplicación.

## Tarifas iniciales

| Modalidad | MXN |
|---|---:|
| Hora normal / preferencial | $15 / $10 |
| Fracción de hasta diez minutos tras una hora completa | +$5, sustituida por la hora completa al superar diez minutos |
| Tiempo libre normal / preferencial | $50 / $60 |
| Lavado de auto | $120 |
| Lavado de camioneta / Van | $170 |
| Lavado de pickup | $200 |
| Complemento de jornada, exclusivamente con lavado | +$30 |
| Mensual nocturna de 12 horas | $500 por mes |
| Mensual de 24 horas | $600 por mes |
| Temporal provisional de hasta 12 horas desde el ingreso | $100 |
| Extravío de tarjeta | +$100 |

Tiempo libre y complemento de lavado son conceptos separados; durante su cobertura no se suma tarifa horaria. No se invierte la tarifa preferencial de tiempo libre. Lavado solo conserva su precio base; no hay tarifa confirmada de lavado para motos.

La jornada **no equivale automáticamente a 24 horas**. Apertura/cierre e inicio/fin nocturno comienzan sin definir. Un administrador puede configurarlos explícitamente. Fuera de cobertura o sin horario confirmado se exige resolución administrativa justificada; no se inventan excedentes. Las mensualidades usan fechas de inicio y vencimiento explícitas, pago pendiente o confirmado, y no se renuevan automáticamente. Una pensión pagada registra cada visita y su ocupación sin crear otro ingreso por la misma mensualidad.

Cada estancia conserva la versión de tarifas al ingresar. Los reportes cuentan pagos confirmados, distinguen modalidades y empleados y permiten CSV y comparación por periodo. La confirmación monetaria se bloquea si falla la conexión con la tablet; no se fabrica una cola de pagos desde el teléfono.

## Desarrollo y pruebas en Windows

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

## Instalación en HONOR Pad 8

[Descargar APK de pruebas 0.6.0 para la tablet](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/download/v0.6.0/El-Oeste-0.6.0-pruebas.apk).

1. Conectar la tablet al Wi-Fi del negocio e instalar la APK de pruebas 0.6.0 encima de la existente, conservando sus datos. No se requiere una computadora para generar certificados.
2. Abrir **El Oeste · Servidor**, crear el usuario administrador y su PIN. La app prepara automáticamente una CA y un certificado únicos para esa instalación. Las claves privadas se generan dentro de AndroidKeyStore y no se exportan ni vienen compartidas dentro de la APK.
3. Cuando indique **Activo**, pulsar **Conectar un celular**. Con el celular en el mismo Wi-Fi, escanear el QR, descargar `El-Oeste-CA.cer` y seguir la guía de autorización del teléfono. La pantalla de la tablet muestra la huella SHA-256 para comprobar que se instala su certificado correcto.
4. Abrir la dirección `https://IP-DE-LA-TABLET:8443`, entrar con usuario/PIN y agregarla a la pantalla de inicio. Autorizar la cámara al usarla. No omitir advertencias TLS.
5. Crear empleados desde **Resumen del negocio → Equipo** y obtener las 35 tarjetas en **Tarjetas → Descargar PDF carta**. Sus secretos nacen aleatoriamente en la instalación privada.

**¿Qué se ahorró?** La instalación habitual ya no necesita crear ni importar `server.p12`, instalar JDK en otra computadora o manejar una contraseña de certificado. La CA pública se obtiene directamente de la tablet. Los certificados importados en versiones anteriores se conservan; la importación externa sigue disponible dentro de Opciones avanzadas.

**¿Puede eliminarse `El-Oeste-CA.cer`?** En este diseño local, sin dominio público y operativo sin Internet, cada teléfono debe autorizar una vez la CA de la tablet para usar HTTPS y cámara. La aplicación no puede concederse esa confianza por sí misma. `El-Oeste-CA.cer` contiene sólo el certificado público, nunca la clave privada. No se deben instalar certificados de una fuente desconocida.

En iPhone: revisar e instalar el perfil y activar su confianza en **Ajustes → General → Información → Ajustes de confianza de certificados**. La [guía de Apple](https://support.apple.com/en-us/102390) explica esta autorización. En Android: **Ajustes → Seguridad → Instalar certificado → Certificado de CA**; el nombre del menú varía según fabricante y versión. Cada usuario realiza la autorización en su teléfono. Si el navegador no reconoce la conexión tras autorizarla, revisar certificado, fecha e IP; no desactivar su validación.

La guía de conexión usa temporalmente HTTP en el puerto 8788, con una ruta aleatoria y caducidad de 10 minutos. Sólo entrega instrucciones y la CA pública: no tiene API, cookies, PIN, vehículos ni cobros. Se cierra al salir de esa pantalla de la tablet. Como la descarga inicial no está autenticada por HTTPS, **comparar la huella del certificado con la pantalla física de la tablet antes de instalarlo**. La operación continúa exclusivamente en HTTPS, puerto 8443.

En la conexión automática, si cambia la IP del Wi-Fi, la app renueva el certificado del servidor conservando la misma CA; el enlace guardado en los teléfonos sí debe actualizarse. Se recomienda reservar la IP en el router para mantener estable el acceso. El Wi-Fi debe permitir comunicación entre sus dispositivos; no abrir estos puertos a Internet. La renovación local del certificado no requiere Internet. Los certificados externos importados siguen sujetos a su configuración y renovación manual. Desinstalar la app o borrar sus datos elimina su identidad local y exige preparar y autorizar una nueva instalación.

Eliminar la autorización manual requeriría otro esquema: dominio propio y certificado de una autoridad pública, con configuración de DNS y renovación por Internet. No está activado ni se supone contratado.

El servidor usa servicio en primer plano con notificación, recuperación `START_STICKY` y aviso tras reinicio. Android puede detener procesos: tras reinicio, cierre forzado o ahorro de energía, verificar el estado y reabrir la app si procede. No se cambian ajustes globales, permisos USB ni políticas de El Muelle. La prueba prolongada con El Muelle en primer plano y la báscula conectada permanece obligatoria antes de producción.

## Respaldo y restauración

Administración → **Respaldo y restauración** descarga un archivo `.oeste` comprimido y cifrado con AES-256-GCM; la contraseña independiente se deriva con PBKDF2. Incluye datos, usuarios con hashes, tarifas y tarjetas. Guardarlo fuera de la tablet y conservar su contraseña por un medio privado. No incluye sesiones ni fotografías.

Para restaurar: respaldar primero el estado actual, seleccionar la copia, introducir su contraseña, PIN de administrador y `RESTAURAR`. La sustitución se hace dentro de una transacción; un archivo alterado, una contraseña equivocada o inconsistencias dejan intacta la base. Se cierran las sesiones y se reconcilia la cola remota. Los certificados y el PIN nativo de configuración pertenecen a la instalación y no se transfieren mediante este respaldo. Esta versión limita el documento descomprimido a 32 MB y el archivo cifrado a 8 MB; para históricos mayores se requiere una ampliación de exportación por streaming.

## Réplica remota y privacidad

[remote/](remote/) contiene Worker, esquema D1 y panel de consulta. Configuración en [docs/SINCRONIZACION.md](docs/SINCRONIZACION.md). No se ha supuesto un despliegue ni credenciales Cloudflare. La cola local persiste eventos de pago únicos con época y secuencia, reintenta con espera creciente y sólo confirma lotes reconocidos por el Worker. Las restauraciones abren otra época de secuencia para no colisionar con pagos remotos previos. El panel indica la última confirmación y datos atrasados.

No sincroniza placas, fotografías, marca, color, PIN, tokens QR ni notas de resolución. El panel valida Cloudflare Access; el PIN local no protege un panel financiero expuesto a Internet. Los límites de planes gratuitos pueden detener la réplica, sin detener la operación local.

## Código y licencias

- `core/`: tarifas, autenticación, API, respaldo y servidor HTTP(S) compartidos.
- `android/`: SQLite nativo, actividad de configuración, servicio y sincronización.
- `desktop/`: host de prueba con SQLite JDBC; no es un requisito para los teléfonos.
- `web/`: PWA, recursos locales, OCR y generador de tarjetas imprimibles.
- `tests/`: reglas, integración, seguridad y pruebas nativas separadas.

Iconografía, marca y paisaje vectorial de El Oeste creados para este proyecto. No incluyen activos comerciales de El Muelle. Tipografía Manrope bajo OFL; avisos y procedencia de terceros en [THIRD_PARTY.md](THIRD_PARTY.md).

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

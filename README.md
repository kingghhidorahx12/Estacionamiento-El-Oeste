# Estacionamiento El Oeste

Aplicación local para entradas, salidas, cobros en efectivo, lavados, pensiones y tarjetas reutilizables. Servidor Android independiente: `mx.eloeste.servidor`. SQLite permanece en la tablet; la interfaz web se instala en iPhone y Android. La réplica Cloudflare es sólo de consulta.

El proyecto conserva el motor y la persistencia desarrollados inicialmente. El estado de verificación y los límites de la entrega están en [docs/ESTADO.md](docs/ESTADO.md).

## Operación

1. Ingresar con usuario y PIN personal de 6 a 12 dígitos.
2. **Entrada:** escanear o elegir tarjeta, identificar vehículo, confirmar datos y seleccionar servicio.
3. **Salida:** escanear tarjeta o buscar el vehículo activo; comprobar físicamente sus características y confirmar efectivo. El servidor vuelve a calcular el total antes de cerrar.
4. **Mi actividad:** cada empleado consulta sus propios cobros. Administración contiene pensiones, reportes, tarjetas, reglas, usuarios y respaldos.

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

1. Reservar una IP para la tablet en el router del negocio. Usar Wi-Fi sin aislamiento entre clientes.
2. Generar una CA local y certificado para esa IP:

   ```powershell
   ./scripts/tls.ps1 -Ip 192.168.X.Y -JavaHome C:/ruta/jdk-21
   ```

3. Conservar **privadamente** `.dev/tls/ca.p12` y su contraseña. Transferir sólo `server.p12` a la tablet y el certificado público `El-Oeste-CA.cer` a cada teléfono. El script no instala certificados ni cambia la seguridad del sistema automáticamente.
4. Instalar la APK de pruebas en un entorno de ensayo. Abrir **El Oeste · Servidor**, crear administrador/PIN, importar `server.p12` con su contraseña y pulsar **Iniciar servidor**. Autorizar las notificaciones para poder comprobar su estado.
5. Entrar a `https://IP-DE-LA-TABLET:8443` desde los teléfonos tras instalar la CA de forma autorizada. El certificado debe coincidir con la IP; no omitir advertencias TLS. No abrir el puerto en Internet.
6. Crear empleados desde Administración y generar las 35 tarjetas en **Tarjetas QR → Imprimir tarjetas**. Los identificadores nacen aleatoriamente en esa instalación privada; no se suministra una colección pública de QR productivos.

En iPhone: instalar el certificado público como perfil, revisarlo y activar su confianza en **Ajustes → General → Información → Ajustes de confianza de certificados**, según la versión. La [guía de Apple](https://support.apple.com/en-us/102390) confirma que un perfil instalado manualmente no obtiene confianza SSL automáticamente. Luego abrir la URL HTTPS en Safari y usar **Compartir → Añadir a pantalla de inicio**. En Android: instalar la CA de usuario desde las opciones de certificados del sistema y abrir la URL en Chrome; añadir/instalar la aplicación desde su menú. Cada persona autoriza su certificado y su cámara. No se instala una CA privada ni su clave en los teléfonos.

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

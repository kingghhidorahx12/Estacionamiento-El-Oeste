# Continuidad de El Oeste

Fuente vigente: instrucción consolidada del propietario, 12 de noviembre de 2026. Arquitectura Android/web local; publicación en GitHub. No migrar a Sites.

Auditoría inicial de esta continuación:

| Estado | Evidencia y diferencia |
|---|---|
| Implementado y verificado | Motor horario con segundos límite; lavados y complemento; bloqueo de cobros sin cobertura; transacciones SQLite, idempotencia, roles básicos, 35 QR y límite de 30; 140 comprobaciones Java anteriores, 12 HTTP y 6 de réplica; flujo de lavado+jornada a $150 y reporte conciliado observados en navegador. |
| Implementado incompleto | Servidor Android compilado y APK firmada para pruebas; HTTPS y PWA; OCR/QR sintéticos observados. Faltan pruebas físicas. La suite nativa no se ha ejecutado. El emulador x86 requiere un hipervisor que no está instalado; no se modificó el sistema. |
| Ausente o insuficiente | Tiempo libre $50/$60, acceso mensual 12/24 h, altas pendientes de pago, PIN personal, restauración protegida, reportes separados y comparaciones, reposición de tarjeta durante estancia. |
| Incorrecto frente a la nueva instrucción | Modalidades mensuales A/B todavía sin horas; contraseñas en lugar de PIN; etiqueta extendida de Van; apariencia genérica; duplicación de acciones. La compilación Java incluía accidentalmente pruebas Android. |

Se conserva el código funcional y se amplían las diferencias. El Muelle se consulta exclusivamente como referencia de Glass Atelier; no se modifican sus archivos, instalaciones, datos ni USB. Kahatsa Core queda excluido como referencia.

Validación física pendiente: HONOR Pad 8 junto con El Muelle y báscula, consumo sostenido, pantalla bloqueada/reinicio, cámara y PWA Safari/iPhone y Chrome/Android, confianza de CA local y Wi-Fi sin Internet. La réplica Cloudflare requiere configuración y despliegue propios; no se ha afirmado una publicación remota.

La entrega final actualizará este mismo archivo con resultados y commits reales; no duplicar bitácoras.

## Resultado de la continuación · versión 0.2.0

Conservado: cálculo horario y sus límites, lavados, complemento de jornada, SQLite, transacciones, idempotencia, tarjetas reutilizables, capacidad de 30 y separación respecto a El Muelle.

Corregido y ampliado:

- Tiempo libre independiente: $50 normal / $60 preferencial. Jornada y horario nocturno pendientes por defecto; no se presuponen 24 horas ni excedentes automáticos.
- Mensualidades de 12 y 24 horas, fechas explícitas, pago pendiente o posterior y registro de visitas. La salida cubierta no crea otro pago por la misma mensualidad. Los contratos previos sin modalidad horaria no reciben cobertura inventada.
- PIN personal, usuarios/permisos, historial propio protegido, confirmación reforzada de extravío y reposición con reserva.
- Reportes por modalidad y categoría, comparación de periodos, CSV, respaldo cifrado y restauración transaccional con revocación de sesiones.
- Réplica con validación de JWT firmado, SQL real de deduplicación y épocas de secuencia para restauraciones. No sincroniza vehículos, imágenes, PIN ni QR.
- Composición e información reorganizadas tomando Glass Atelier como referencia: Entrada/Salida prioritarias, administración aparte, lista de vehículos, formulario en dos pasos, iconos SVG, marca y paisaje originales, tipografía local y PNG específicos para instalación PWA. Van aparece únicamente como «Van».
- Compilación de escritorio separada de la instrumentación Android. Rutas estáticas confinadas a la carpeta web y protecciones de origen/CSRF verificadas.

Evidencia ejecutada:

| Comprobación | Resultado |
|---|---|
| Suite Java conservada | 148 verificaciones aprobadas |
| Requisitos consolidados | 42 verificaciones aprobadas |
| Cierre y reapertura de SQLite en disco | 11 verificaciones aprobadas; estancia, tarjeta, recibo e idempotencia conservados |
| Transporte TLS | 8 verificaciones con CA y nombre de host realmente validados; sin desactivar validaciones ni instalar confianza en Windows |
| HTTP final | 17 verificaciones aprobadas: sesión, origen, CSRF, conciliación, bloqueo de rutas externas y PNG instalables reales con MIME correcto |
| Réplica | 8 pruebas aprobadas; SQL real, lotes repetidos, conflictos, nueva época y JWT firmado/falsificado |
| Navegador de escritorio y viewport móvil 390 × 844 | Acceso por PIN, entrada de Van, lavado+jornada por $200, resolución y pago único; alta mensual pendiente y pago posterior por $600; comparación por periodo; sin errores de consola observados |
| Revisión móvil del reporte | Ancho de documento y viewport iguales, sin desbordamiento horizontal; gráfica de un solo día eliminada |
| OCR y QR | Lectura local de placa sintética ABC-123-A y decodificación QR; no equivalen a precisión física de cámara |
| APK | Compilada, firma de pruebas verificada y recursos cotejados byte a byte contra `web/`; sin bases, respaldos, certificados, claves o colecciones QR privadas |
| Instrumentación Android | Compilada por separado; no ejecutada. El emulador disponible requiere un hipervisor que no está instalado; no se alteró el sistema |

Entregables locales:

- `artifacts/El-Oeste-0.2.0-pruebas.apk` — 13,892,050 bytes; SHA-256 `551e48f9e385337d7017ad8dfe2283764179c136b409f5afafb903eea347dacb`.
- `artifacts/El-Oeste-Web-0.2.0.zip` — recursos web y guía. Sus huellas actuales están en `artifacts/SHA256SUMS.json`.
- Instalación, certificados y respaldo: `README.md`. Consulta remota: `docs/SINCRONIZACION.md`.

Pendientes reales: instalación y prueba sostenida en HONOR Pad 8 con El Muelle en primer plano y báscula USB; RAM/CPU, pantalla bloqueada, reinicio y recuperación; cámara/PWA y confianza de CA en iPhone/Safari y Android; Wi-Fi del establecimiento sin Internet. No se acreditan estas condiciones con pruebas de escritorio. Cloudflare cuenta con código y configuración reproducibles, pero requiere la cuenta/dominio/Access y un despliegue real; no está publicado ni se presenta como activado.

Publicación GitHub confirmada: rama `main` del repositorio oficial `kingghhidorahx12/Estacionamiento-El-Oeste`, commit de implementación `576f1909f8b345c93417d8d722808428bbd102c7`, 83 archivos. El servidor remoto devolvió exactamente ese SHA tras el push. Se verificó la autorización explícita del adjunto y la titularidad/permisos del repositorio después de un rechazo inicial de la revisión automática. Los artefactos de prueba y los datos privados están excluidos del repositorio.


## Identidad y conexión simplificada · versión 0.3.0

Solicitud del propietario: volver a observar El Muelle con atención, corregir la identidad del Oeste y reducir pasos de operación e instalación. Se revisaron su portada renderizada, las ilustraciones públicas y los patrones Glass Atelier en CSS, sin ejecutar su servidor ni modificar su proyecto, datos o dispositivos.

Cambios terminados:

- Marca original de sol en el horizonte y flecha hacia el poniente; versiones SVG, PNG e icono nativo coherentes. Ilustración original de estacionamiento con luz de atardecer, guardada y servida localmente; se retiró el paisaje geométrico anterior. No se copiaron ilustraciones ni marca de El Muelle.
- Portada, barra de navegación, banda continua de indicadores, acciones oro/azul, formularios y consulta remota con la misma dirección visual. En escritorio las acciones se alinean con el título; en celular permanecen al alcance en el control inferior.
- Entrada en una sola pantalla y una confirmación. Se retiraron Continuar/Volver intermedios y la etiqueta Lavado repetida cuando la modalidad ya lo expresa. Tarjeta visible también en celular. El importe bloqueado por cobertura se identifica como Base.
- Certificados automáticos exclusivos de cada instalación Android. Las claves RSA se generan en AndroidKeyStore sin exportación; no se incorpora una clave privada compartida ni un server.p12 en la APK. Se conserva el PIN local y la compatibilidad con certificados externos previos.
- La app detecta IPv4 del Wi-Fi, conserva su CA y renueva el certificado del servidor si cambia la IP o se acerca a su caducidad. Generación y reintentos fuera del hilo de interfaz. La importación PKCS12 y la réplica opcional pasan a Opciones avanzadas.
- Conectar un celular muestra un QR y huella SHA-256. El puerto 8788 entrega únicamente instrucciones y CA pública en una ruta aleatoria durante un máximo de diez minutos y mientras esa pantalla está abierta. No expone API, PIN, cookies, cobros ni archivos arbitrarios. La huella debe compararse contra la tablet física; la descarga HTTP inicial no es autenticada. Toda la operación sigue en HTTPS 8443.
- La autorización de la CA por el sistema de cada teléfono sigue siendo manual y necesaria una vez por instalación. No se presenta como eliminada ni se instala confianza sin participación del usuario. No hace falta crear o transferir server.p12 desde una computadora en la instalación automática.

Verificación de esta actualización:

| Evidencia | Resultado |
|---|---|
| Pruebas existentes de negocio y persistencia | 148 + 42 + 11 aprobadas; tarifas y reglas comerciales conservadas |
| Certificados automáticos en JDK | 18 aprobadas: PKIX estándar, usos de CA/servidor, identidades distintas, renovación con la misma CA, TLS 1.2/1.3, rechazo de CA e IP incorrectas y descarga pública limitada |
| Integración HTTP sobre base de ensayo | 17 aprobadas: acceso, sesión, origen, CSRF, recursos, conciliación y confinamiento de rutas |
| Navegador | Portada y operación en escritorio y 390 × 844; entrada de Van con lavado/jornada por $200 mediante una confirmación; cobertura indefinida conservada, sin doble etiqueta; administración y QR de conexión renderizados; sin errores de consola observados |
| Android | APK y firma de pruebas compiladas; instrumentación ampliada con CA AndroidKeyStore no exportable y handshakes, compilada pero NO ejecutada |

Pendiente antes de producción: probar generación de claves, TLS y QR dentro de Android en la HONOR real; instalar y autorizar la CA en Safari/iPhone y Chrome/Android; renovar al cambiar IP; Wi-Fi sin Internet, bloqueo/reinicio, consumo prolongado y coexistencia con El Muelle y báscula. Las pruebas JDK y de navegador no sustituyen estas verificaciones físicas. Cloudflare conserva los pendientes de cuenta/dominio/despliegue indicados en la sección anterior.

Entrega 0.3.0: `artifacts/El-Oeste-0.3.0-pruebas.apk`, 16,771,737 bytes, SHA-256 `53daa881e221ce35a8321ac2a420a1c9bc1caadd3d9fcbf739673197d127c08e`. Paquete web: `artifacts/El-Oeste-Web-0.3.0.zip`; las huellas de ambos se regeneran en `artifacts/SHA256SUMS.json`. Se cotejaron todos los recursos del APK byte a byte contra `web/` y se verificó ausencia de bases, respaldos, certificados, claves y archivos privados.

Commit de implementación 0.3.0: `8e262603c41878b9816d737aec83799679562f06` (36 archivos revisados; sin artefactos privados).


## Cierre de conexión desde celular Android · versión 0.3.1

Evidencia del propietario: video del 12/11/2026 grabado en un **celular Android**, no en la tablet. El instalador informa que se instaló el certificado de CA; la página pública del QR abre. Al abrir el estacionamiento en el puerto 8443, Chrome muestra ERR_CONNECTION_CLOSED. Esto no demuestra por sí mismo cuál excepción ocurrió en la tablet.

Se encontró un defecto concreto compatible con ese síntoma: la clave no exportable del servidor no autorizaba DIGEST_NONE ni ENCRYPTION_PADDING_NONE. [Android documenta estas autorizaciones para operaciones TLS delegadas](https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.Builder#setDigests(java.lang.String...)). El código de [Conscrypt CryptoUpcalls](https://github.com/google/conscrypt/blob/master/common/src/main/java/org/conscrypt/CryptoUpcalls.java) delega operaciones RSA con el digest/padding ya preparado por TLS.

Corrección:

- Nueva clave `oeste-local-server-v2` con las autorizaciones de digest y padding que necesita TLS. Se conserva `oeste-local-root-v1`, el archivo CA y la clave v1; se renueva sólo el certificado del servidor. No se elimina identidad, datos, PIN, tarifas ni registros.
- Prueba interna acotada con el proveedor real: TLS 1.2 ECDHE-RSA y TLS 1.3, CA específica y nombre de host validado. Sin cambios en confianza de Windows/Android. La app no anuncia Activo si falla y presenta un código TLS12/TLS13 en lugar de atribuir todo a Wi-Fi.
- Actualización 0.3.1, versionCode 4, con la misma firma que 0.3.0. Instalar **encima en la tablet**, abrir El Oeste · Servidor y activar la conexión. No desinstalar ni borrar datos; el celular conserva la misma CA y URL.

Verificaciones ejecutadas: 4 pruebas JDK de conexión real y detección de fallos (TLS 1.2/1.3, CA ajena, clave incorrecta y servidor sin clave); APK y firma verificadas; recursos del paquete cotejados contra web sin datos ni claves privados; instrumentación Android compilada con comprobación KeyInfo y modo de ensayo de migración v1→v2 conservando CA. Las suites de negocio y la interfaz no se modificaron en esta corrección.

No ejecutado: el emulador sin aceleración no consiguió arrancar Android; la suite nativa y la migración real siguen pendientes. No hay dispositivo físico conectado por ADB y la conexión de diagnóstico desde esta computadora al servidor mostrado en el video agotó su tiempo de espera. **No se presenta la causa del video como confirmada por logs del dispositivo ni la corrección como comprobada físicamente.** La prueba interna incluida en la APK verificará el proveedor de la tablet al activarla.

Entrega: `artifacts/El-Oeste-0.3.1-pruebas.apk`, 16,775,833 bytes; SHA-256 `5484dd325b455cba421d849dd1e34488d80be1eebef22bd0a25cee860cbe3335`. Firma de actualización conservada: certificado SHA-256 `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`. Artefactos privados fuera de Git.

Commit de implementación 0.3.1: `73be4bbadeab09553d06d956761c2975f52e32dc` (11 archivos revisados).


## Altas de usuarios y canal de actualización · 0.4.0 · 13/11/2026

Reporte: la pantalla de alta muestra falta de confirmación al crear un empleado. La captura no incluye logs de la tablet. Se identificó un coste duplicado comprobable: el alta derivaba el PIN con PBKDF2 y también derivaba otro verificador completo para la idempotencia, mientras el cliente abortaba a los 20 segundos.

Cambios:

- El alta conserva PBKDF2 de 210,000 iteraciones y reutiliza el verificador protegido ya calculado. El registro idempotente conserva metadata, salt y el mismo hash fuerte; no crea un hash rápido del PIN. Un reintento verifica el PIN original incluso después de un cambio posterior. Se conservan los registros de versiones anteriores.
- Alta y ajuste conservan su identificador en memoria al perder respuesta; los PIN no pasan a sessionStorage/localStorage. Espera de hasta 60 segundos y texto Creando usuario. El servidor devuelve JSON cuando un procesamiento de API falla, sin datos internos en la respuesta.
- Actualizar aplicación se incorpora a Administración y a la app nativa. Sólo un administrador puede solicitar la preparación por la API local. El evento queda auditado y los reintentos no repiten la orden.
- La tablet consulta un canal fijo de GitHub por HTTPS, descarga fuera del hilo de interfaz y verifica tamaño, SHA-256, paquete, versión creciente, compatibilidad Android y firma igual a la instalación existente. No acepta URL arbitraria ni baja de versión. El proveedor de instalación comparte sólo la APK en lectura.
- La descarga terminada conserva metadata y se vuelve a verificar antes de instalar. Una orden administrativa permite únicamente esa instalación durante 30 minutos, sin desbloquear configuración. Android conserva la confirmación de instalación y puede pedir autorizar El Oeste como origen una vez. No se instala en silencio.
- No se agregan comandos al panel Cloudflare; permanece de consulta. La operación no depende de Internet. La actualización inicial a 0.4.0 se instala encima para incorporar este mecanismo; mantiene datos y CA.

Evidencia ejecutada:

| Prueba | Resultado |
|---|---|
| Negocio y persistencia existentes | 148 + 42 + 11 aprobadas |
| Gestión de usuarios y autorización de actualizaciones | 17 aprobadas: alta, PIN protegido, reintento, cambio de datos, compatibilidad anterior, permisos y último administrador |
| Manifest y canal de descarga | 14 aprobadas: versión, tamaño, hash, origen oficial y bloqueo de redirecciones no autorizadas |
| Cliente de solicitudes | 3 pruebas Node aprobadas: reintento conserva ID, cambio de datos usa otro y HTTP 500 no descarta el ID; sin PIN en almacenamiento de navegador |
| Integración HTTP de ensayo | 17 aprobadas |
| Transporte HTTPS | 8 aprobadas con CA y nombre de host validados |
| Navegador | Alta y desactivación de empleado de ensayo observadas en la base local aislada; nueva sección de actualización renderizada; sin errores de consola. Captura privada en artifacts/usuarios-creados-0.4.jpg |
| Android | APK y firma verificadas; instrumentación ampliada para altas y reintentos, compilada. No se ejecutó en dispositivo |

Entrega de pruebas: `artifacts/El-Oeste-0.4.0-pruebas.apk`, versionCode 5, 16,796,313 bytes; SHA-256 `978f941751b9ddd8ab8e851620ed3295d3c6d31f7e1f88abf7c6c3bfc27a6404`. Se conserva la firma de actualización y se cotejan recursos web byte a byte. No contiene bases, respaldos, claves ni certificados privados.

Pendiente físico: repetir el alta en la HONOR y probar una actualización posterior real con confirmación del instalador, incluido permiso de origen de instalación, notificación y recuperación del proceso. Las pruebas de escritorio no acreditan esos pasos. Se conserva el resto de pendientes físicos de las secciones anteriores.

Commit de implementación 0.4.0: `39d114b2ae03dede84721b83e730719c7353a5bd`, publicado en main. Versión de pruebas publicada: https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.4.0. GitHub confirmó la misma huella SHA-256 y tamaño. Se descargó de forma pública, sin sesión, siguiendo la redirección HTTPS hacia release-assets.githubusercontent.com y se obtuvo un archivo idéntico a la APK firmada. El manifest del canal se publica después de esa comprobación; no expone secretos ni datos del negocio.

## Operación y tarjetas carta · versión 0.5.0

Continuación del 13/11/2026. Se conservan las tarifas, decisiones comerciales confirmadas, contratos, pagos, CA, firma y paquete. Sin cambios a El Muelle, sus datos, permisos ni USB.

Implementado:

- Un escaneo: tarjeta libre abre ingreso; asignada abre salida; reserva, suspendida, perdida o revocada requiere revisión. La consulta se calcula de nuevo cada vez, sin reutilizar un resultado anterior de entrada/salida. Seleccionar número ofrece el mismo flujo sin cámara. Escanear nunca cobra ni registra el ingreso automáticamente.
- Marca y color son selectores reales con «Otro» condicional. Se conservan valores personalizados de contratos previos. Sin placas solicita señas; las observaciones excepcionales se despliegan cuando hacen falta. El lavado se calcula por tipo; sólo lavado retira el control redundante. La cámara propone placas editables, sin simular reconocimiento de marca/color.
- Cobro con Exacto y billetes, cambio estimado, verificación física obligatoria, cierre atómico y confirmación breve sin otra pantalla de recibo. Cancelar entrada activa o lavado pendiente exige administrador y motivo. El empleado puede solicitar esa autorización en la misma pantalla, conserva su sesión y actor. Se archiva el registro, no se borran pagos. El PIN de autorización no se persiste en claro ni con hash rápido.
- Administrador abre resumen real del negocio: ingresos, ocupación, entradas/salidas, categorías, cobros por persona, últimos cobros, pendientes y periodo 7/30 días. Empleado abre vehículos y escaneo, con sus propios ingresos. Equipo se separa de tarifas; nombres visibles conservan mayúsculas y pueden editarse sin reescribir el identificador histórico. Migración y respaldo compatibles con usuarios anteriores.
- Bloqueo web por inactividad antes de procesar nuevas acciones; los sondeos no prolongan el acceso. Conserva el formulario en memoria y exige PIN del mismo usuario para seguir, sin enviar un cobro al desbloquear. Valores técnicos iniciales propuestos 5/15 minutos, configurables; máximo absoluto de sesión 12 horas. No se promete recuperar un formulario después de cerrar el navegador o perder su proceso.
- Inicio nativo simplificado: estado, conexiones autenticadas recientes, último respaldo generado, conectar celular y administración protegida. Mantenimiento propuesto de 5 minutos, configurable; cambiar brevemente de app no bloquea inmediatamente ni detiene el servicio. Una instancia de Api por servicio; recuperación LAN/TLS separada de sincronización por Internet. Diagnóstico con marcas de tiempo y eventos de interfaz/servicio. Tras un inicio expresamente activado puede reanudar desde la app, conservando la notificación de reinicio; no se eluden restricciones del sistema.
- Marca comercial de fachada EO y rótulo Rye, versiones principal/horizontal/compacta/clara/oscura/monocroma, iconos PWA/nativo/notificación y tarjetas. Formularios Manrope de 16 px, objetivos táctiles de 48–52 px o mayores, fondos opacos. Se retira la ilustración de los indicadores críticos. Réplica de consulta con la misma identidad, sin añadir comandos remotos.
- Las 35 tarjetas se imprimen en Carta vertical, **85.60 × 53.98 mm**, dos columnas y cuatro filas: ocho por hoja y cinco hojas. QR vectorial con margen de cuatro módulos en la mitad izquierda; logo, nombre, número, tarifas actuales y reglas centrados a la derecha, incluido extravío configurable inicialmente de $100. PDF generado en el navegador, sin enviar códigos a un tercero; también impresión directa con guías de corte. Los cinco números de reserva permanecen reservados. No se incorporan reglas de responsabilidad, recargos o coberturas inventadas.

Evidencia ejecutada:

| Comprobación | Resultado |
|---|---|
| Regresión Java final | **294** verificaciones: 148 negocio/concurrencia + 42 requisitos + 11 persistencia + 17 usuarios + 32 experiencia/autorización/inactividad + 14 canal de actualización + 4 inicio TLS + 18 certificados + 8 transporte |
| JavaScript | **14** pruebas: 8 réplica (incluye SQL/JWT reales), 3 solicitudes y 3 PDF. El arnés de solicitudes se adaptó a eventos de actividad; las tres volvieron a pasar. Sintaxis de app, vehículo y tarjetas comprobada |
| HTTP local aislado | **17** comprobaciones aprobadas: origen, sesión, CSRF, conciliación, MIME y confinamiento de rutas |
| Impresión | PDF de muestra de **5 páginas 612 × 792 pt**, escalado de impresión desactivado en preferencias. Páginas primera y última renderizadas con Poppler; revisión visual de márgenes, alineación y contenido. **35/35 QR decodificados desde el PDF renderizado**, con datos sintéticos de 64 caracteres, sin repeticiones |
| Navegador observado | Antes/después de operación e ingreso; escritorio y entrada a 390 × 844. Marca y color Otro, retorno a marca de lista, ingreso de Van + jornada $200, conservación de Azul petróleo, selección de tarjeta asignada que abre salida, resolución manual explícita, Exacto y pago único $200 con retorno al trabajo. Panel administrativo y 35 tarjetas renderizados |
| Contraste calculado | Texto crítico 13.76:1; controles 13.99:1; botón principal 13.74:1. Cálculo de colores, no prueba de legibilidad al sol |
| Android | APK 0.5.0 / versionCode 6 compilada y firma v3 verificada; recursos web cotejados byte a byte; sin bases, respaldos, certificados, claves ni QR privados incluidos; instrumentación compilada, no ejecutada |

Capturas privadas en `artifacts/antes-operacion-0.4.jpg`, `antes-ingreso-0.4.jpg`, `despues-ingreso-390.jpg` y `despues-tarjetas-carta.jpg`. Muestra sintética marcada NO VÁLIDO: `artifacts/El-Oeste-Tarjetas-Carta-MUESTRA.pdf`; los códigos operativos se obtienen exclusivamente en la instalación del negocio. La decodificación de un PDF no acredita impresora, recorte, enmicado o cámara físicos.

Límites de esta revisión: la herramienta de control del navegador agotó su tiempo de espera al ampliar la matriz visual. No se acredita revisión final a 360 px, ambos sentidos de tablet, teclado virtual, simulación de reflejo/baja luminosidad ni todos los estados visuales. Tampoco se ejecutó la app nativa en un emulador funcional o dispositivo. Permanecen obligatorias las pruebas HONOR con El Muelle y báscula, pantalla apagada/bloqueada, cambio de Wi-Fi, LAN sin Internet, reinicio, cámara/PWA de Android e iPhone, impresión y lectura física. No se presentan como aprobadas ni como entrega de producción.

Play Protect: el propietario informó «Se bloqueó la app dañina… puede poner tu dispositivo en riesgo». Es un bloqueo de seguridad; no permite identificar su categoría o causa exacta. Revisión estática: no se agregaron permisos de cámara, contactos, SMS, ubicación, almacenamiento compartido o USB; `REQUEST_INSTALL_PACKAGES` ya existía en 0.4.0 para la actualización confirmada por Android. El proveedor de APK, servicio y receptor son no exportados; se conserva firma y verificación de paquete/hash/versión del canal oficial. No hay diagnóstico del dispositivo que atribuya el bloqueo a un permiso, firma de pruebas o dependencia, ni evidencia de que el rediseño lo elimine. No se desactivaron protecciones ni se prescribe omitir el aviso. Revisión física y diagnóstico de Play Protect pendientes.

Entrega de pruebas 0.5.0: APK **17,227,280 bytes**, SHA-256 `a444846779190c705a090b766940d6fc6ed050a94ede8b1f889b322dd3a470af`. Firma de actualización conservada: certificado SHA-256 `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`. Commit de implementación `5c29ee73f8f4f7ac1ced6e445cd875482a9a79d7`, cotejado con main remoto. [Prerrelease oficial 0.5.0](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.5.0) publicado; GitHub confirmó tamaño y digest idénticos. Descarga pública verificada sin sesión, mediante redirección HTTPS autorizada a release-assets.githubusercontent.com. `updates/latest.json` se actualiza al final con esa misma URL, tamaño, hash y versionCode 6. No se distribuyen códigos de la instalación. La réplica sigue requiriendo la configuración y despliegue descritos anteriormente.

## Centrado, acceso sin inactividad y periféricos · versión 0.6.0

Correcciones solicitadas por el propietario el 13/11/2026; sustituyen los criterios de inactividad de 0.5.0.

- Tarjetas Carta: únicamente precios normales; retiradas ambas referencias preferenciales del HTML y del PDF. Se conserva la tarifa preferencial en el motor de cobro y su configuración. Medidas, 35 códigos, margen QR y distribución de cinco hojas sin cambios.
- Composición centrada: encabezado, marca, navegación, títulos, campos, acciones, módulos e indicadores en cliente/PWA, app nativa y consulta remota. El ingreso principal pasa al centro; se retira la posición lateral de las acciones que desplazaba el título. La consulta conserva su condición de réplica, sin comandos.
- Eliminado el bloqueo por inactividad de cuentas y mantenimiento nativo, junto con sus controles. Las preferencias antiguas ya no producen bloqueos. Se conserva cierre/bloqueo manual, máximo absoluto previo de sesión de 12 horas, PIN administrativo y límites por intentos fallidos. No se eliminan usuarios ni sesiones al actualizar.
- Nuevo apartado único **Periféricos** en administración web y nativa. No se inyecta su contenido en Tarifas o Equipo; el navegador comprobó ausencia del formulario de impresora fuera de esa sección. No se solicitan permisos ni se abren conexiones USB al visitar otras secciones.
- Referencia de El Muelle leída sin modificarlo: configurador `android/web/printer.js` y transportes `PrinterHost`, `PrinterNetworkPolicy`, `LanPrinterTransport`. Perfil inicial compatible: ESC/POS, 80 mm, 48 caracteres, ASCII/página 0, ocho líneas finales, LAN 9100; también 58 mm, CP850/Windows-1252 y cortador explícito. No se leen/importan las preferencias privadas Android de El Muelle; no se inventa IP ni identidad USB.
- LAN admite IP privada explícita y tiempos acotados; comprobar conexión envía cero bytes. USB enumera exclusivamente interfaces clase impresora, solicita autorización sólo mediante acción explícita en la tablet y abre/cierra al imprimir. `claimInterface(..., false)` impide forzar la liberación de otro programa. La selección usa VID/PID/interfaz/serie cuando está disponible; ante varias idénticas requiere selección. Sin captura de báscula, filtros de autoapertura, cambios de permisos o modificaciones a El Muelle.
- Configuración, comprobación y prueba de papel requieren administrador. Historial permite solicitar una copia del pago confirmado; empleado sólo de sus pagos. Imprimir no escribe otro pago. Cola asíncrona acotada, reintentos de la misma solicitud deduplicados y estados de envío sin asegurar salida física. No hay reimpresión automática tras un error; revisar papel antes de reenviar.

Validación:

| Ámbito | Evidencia |
|---|---|
| Java | **320** comprobaciones aprobadas: las 294 existentes adaptadas a la eliminación de inactividad + 26 de impresora. Incluyen configuración sólo administrativa, copia de pago propio, rechazo de otro empleado, cero ingresos por prueba/reimpresión, direcciones LAN permitidas, transporte simulado y liberación de conexión, prueba sin bytes, límites y eliminación de comandos de control del texto |
| Acceso | Sesiones web válidas tras más de una hora sin actividad, incluso con una política antigua de un minuto guardada; cierre manual revoca el token. No se acredita permanencia fuera del máximo absoluto de sesión |
| JavaScript/PDF | **14** pruebas aprobadas: réplica 8, solicitudes 3, PDF 3. Aserción explícita de sólo precios normales aunque cambien precios preferenciales. PDF cinco páginas Carta; tarjeta renderizada revisada sin texto ni importes preferenciales |
| HTTP | **17** comprobaciones aprobadas en base aislada: origen, cookies, sesión, CSRF, conciliación, MIME y rutas |
| Navegador | Panel centrado; Equipo sin inactividad; Tarifas sin formulario de impresora; sección Periféricos con selector USB/LAN, 58 mm → 32 caracteres y CP850 → página 2. Formulario a 390 px, Periféricos a 360 px y tablet 1024 × 768 / 800 × 1280 sin desbordamiento horizontal. Títulos/campos y tabla remota calculados al centro. Consulta remota revisada como interfaz estática sin backend de nube, no como despliegue real |
| Android | APK 0.6.0, versionCode 7, compilada y firma verificada. Recursos cotejados byte a byte, sin datos ni claves privados. Soporte USB opcional declarado; no se agregan permisos Bluetooth, ubicación, almacenamiento o USB sobre El Muelle |

Capturas de ensayo: `artifacts/centrado-admin-0.6.jpg`, `centrado-entrada-390-0.6.jpg`, `centrado-tablet-0.6.jpg`, `perifericos-360-0.6.jpg`, `consulta-centrada-0.6.jpg`; tarjeta con datos sintéticos en `tarjeta-normal-0.6.png`. La vista de escritorio indica expresamente que la impresión térmica requiere el servidor Android; no representa hardware conectado.

Pendiente físico: autorizar y comprobar la impresora real por USB/LAN, corte, caracteres, envío simultáneo/alternado con El Muelle, desconexión y báscula. Ninguna impresora real recibió datos durante estas pruebas. Conserva los pendientes HONOR, iPhone, pantalla/reinicio, consumo y Play Protect descritos antes. No se certifica producción ni convivencia física mediante simulaciones.

Paquete de pruebas: **17,243,731 bytes**, SHA-256 `f02204897a44631f5739e5179772e6d8b49d11099cff39d530a90f0fe9a428fa`. Firma conservada `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`; CA sin cambios. Commit de implementación `ea9144d5da409993f4ad328aa31a1a948e585399`, cotejado con main remoto. [Prerrelease oficial 0.6.0](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.6.0) publicado. GitHub confirmó tamaño/digest; descarga pública sin sesión cotejada después de la redirección HTTPS a release-assets.githubusercontent.com. Sólo entonces se actualiza el canal a versionCode 7. Tras actualizar la tablet, recargar el cliente para que use los recursos nuevos.


## Distribución, tolerancia y lector local · 0.7.0 · 13/11/2026

Prioridad del propietario: centrado con buena distribución, sin largas filas de botones, desplegables alfabéticos y referencia visual real de El Muelle. No se modificó ningún archivo, dato, permiso o USB de El Muelle. Se leyeron `public/styles.css` y su ilustración `atelier-lighthouse.svg` sólo como referencia: superficies claras con gradientes, controles compactos y apoyo ilustrado. La fachada/patio EO vectorial y su versión Canvas nativa son originales; no se copia la identidad de El Muelle. Importes y formularios mantienen superficies claras y texto oscuro, sin ilustraciones detrás del cobro. Eliminados el borde inferior duro de botones y la franja de pestaña activa.

- Administración: accesos después del resumen real, 2/3/4 columnas según ancho. Operación: título sin duplicar, ocupación e ingresos en dos celdas, fila de vehículo y pie más compactos. Salida: total único para un solo concepto, desglose cuando hay varios, botones Volver/Cobrar y salir, cancelación/extravío en otra fila; Exacto conserva la resolución administrativa y los billetes se sugieren según el importe. Formularios secundarios, periodos y periféricos agrupan acciones. La app nativa agrupa botones consecutivos en rejilla y recompone celdas al ocultar una acción. Impresora permanece exclusivamente en Periféricos.
- Desplegables: orden por texto español sin distinguir mayúsculas/acentos y números naturales; marcador inicial arriba, «Otro» en su lugar alfabético. Se conservan selección, valor de negocio y opción por defecto, incluidas carga de contratos y opciones de impresora. No se deducen datos del vehículo.
- Normal confirmado explícitamente por el propietario: hasta 10:00 minutos $10; después hasta 60:00 $15; 60:00.001–70:00 $25; después hasta 120:00 $30, repitiéndose cada hora. Preferencial continúa $10/h y conserva su fracción previa. Nueva configuración versionada para futuros ingresos, también al restaurar un respaldo antiguo. Estancias abiertas conservan su instantánea; no se recalculan pagos cerrados ni se cambian QR. Jornada, lavados, mensualidades y coberturas pendientes se conservan.
- Tarjetas: sólo normales; se agrega la tolerancia confirmada al HTML y PDF, con el resto de precios desde configuración. Vista previa reducida en teléfonos sin cambiar medidas físicas, margen QR ni ocho por hoja/cinco hojas.
- OCR: el código anterior creaba y destruía el motor en cada intento, cargaba un modelo de 10,923,060 bytes y no ofrecía un límite ante una inicialización sin respuesta. No hay logs del teléfono que permitan atribuirle una causa única. Modelo fast de 1,984,273 bytes y LSTM/SIMD locales con huellas fijadas. Preparación al abrir ingreso, un worker reutilizado en ese formulario, captura central guiada y lectura automática, estado por etapa, tiempo acotado de 25 s por trabajo y reintento/manual. Adaptador acotado al protocolo del worker Tesseract 5.1.1: todos los rechazos y errores cierran pendientes; no se usa la promesa de inicialización que puede quedar pendiente tras fallar la carga de idioma. [Protocolo del proveedor](https://github.com/naptha/tesseract.js/blob/v5.1.1/src/worker-script/index.js), [inicialización 5.1.1](https://github.com/naptha/tesseract.js/blob/v5.1.1/src/createWorker.js). Fotografías sólo en RAM del cliente; caché exclusiva de recursos públicos. Worker liberado al salir del ingreso, cerrar sesión u ocultar la página; cerrar una foto libera cámara/canvas. El shell consulta el servidor al recargar para recibir cambios; las dependencias públicas usan caché. La limpieza conserva cachés ajenas a El Oeste.

Evidencia ejecutada hasta el cierre de código:

| Ámbito | Resultado |
|---|---|
| Java | **353** comprobaciones aprobadas: 320 previas y 33 de fronteras exactas, cobro con hora autoritativa, total obsoleto rechazado, migración única, instantáneas previas y restauración. TLS/transporte ejecutados con sockets autorizados tras la restricción inicial del sandbox |
| JavaScript | **23** pruebas aprobadas: las 14 existentes, siete del lector (reutilización, error de idioma, timeout, cancelación, errores síncronos/inicio y candidatos) y dos de caché (sin fotos/API, código actualizado y cachés ajenas preservadas) |
| HTTP | **17** comprobaciones aprobadas contra la base aislada de revisión; nunca contra datos del negocio |
| OCR de navegador real | Worker y modelo incluidos, con CSP de producción, placa sintética ABC-123-A leída dos veces. Primera tanda: preparación 772 ms, lecturas 358/93 ms. Tanda final durante compilación: preparación 2,077 ms, lecturas 1,166/412 ms. Son medidas de esta computadora con placa sintética, no garantías de rapidez ni precisión. No es medición de celular ni cámara física |
| PDF | Cinco páginas Carta; nueva tolerancia y sólo precios normales. Primera tarjeta renderizada con Poppler y revisada visualmente, sin recorte ni solapamiento |

La revisión física en HONOR/celular/iPhone, cámara, velocidad/precisión de OCR real, impresora USB/LAN, convivencia con El Muelle/báscula y Play Protect permanece pendiente. El nuevo estilo no se presenta como solución del bloqueo de Play Protect. La réplica no se desplegó en Cloudflare en esta actualización.


Revisión de navegador completada: ingreso y operación; las ocho secciones administrativas (Equipo, Pensiones, Reportes, Tarjetas, Tarifas, Respaldos, Actualizaciones y Periféricos); diálogos de acceso, mensualidad, tarjeta, salida, extravío y cancelación. Empleado de ensayo con nombre visible conservado, historial propio de un pago de $10 y autorización administrativa requerida para cancelar. Se observó entrada normal de $10; al superar diez minutos mostró $15 y efectivo de $20 calculó cambio de $5. No se registró ese segundo pago desde la interfaz. Impresora ausente fuera de Periféricos; conexión LAN/USB y sus listas ordenadas, dos acciones por fila. No se envió nada a impresoras físicas.

Composición observada en escritorio a 1280 px y fixtures de layout de 360/1024 px: dos y tres accesos por fila, última fila centrada (error de centro calculado 0 px), acciones del cobro en dos columnas y sin desbordamiento horizontal de página. Vista previa de tarjeta a 360 px: ancho disponible/scroll 313/313 px, tarjeta escalada a 297 px; dimensiones de impresión sin modificar. La API de viewport del navegador no cambió las dimensiones efectivas; se usaron iframes locales de ancho real con una excepción de framing exclusiva del proxy de ensayo. La CSP productiva mantiene `frame-ancestors 'none'`. No equivale a emulación completa, teclado móvil ni prueba física. Consulta remota revisada estáticamente en escritorio y 360 px sin backend de nube: error de conexión en lenguaje claro, datos no presentados como confirmados; no es evidencia de despliegue.

Evidencia local, fuera de Git: `artifacts/acceso-0.7.jpg`, `cobro-360-0.7.jpg`, `admin-360-0.7.jpg`, `admin-tablet-0.7.jpg`, `consulta-360-0.7.jpg` y `tarjeta-0.7.png`. Sin errores de consola observados en la revisión final del cliente local. Instrumentación Android compilada, no ejecutada. Android 0.7.0 / versionCode 8 compilado con JDK 21 y SDK 35; firma v3, paquete y certificado de firma conservados. DEX y todos los recursos del APK cotejados byte a byte con la compilación y el código final; sin bases, certificados, claves ni datos de la instalación.

APK final: **10,878,925 bytes**, SHA-256 `9512f3f01a27918e07105b96da6665b989d650e2bdc7ccf3d0de5345304816de`. Certificado de firma SHA-256 `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`.


Commit de implementación `0a56900f64f59584966b9d254be2ea5fb04ef68c`, publicado en main, con lista exacta de 39 archivos revisada (código, pruebas y recursos públicos). [Prerrelease oficial 0.7.0](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.7.0) publicado después de cotejar digest y tamaño de sus assets. Descarga pública sin sesión completada y cotejada byte a byte por SHA-256/tamaño, validando TLS y redirección HTTPS autorizada hacia release-assets.githubusercontent.com. Sólo después se actualiza `updates/latest.json` a versionCode 8. Instalar encima en la tablet y recargar el cliente local; no desinstalar, borrar datos ni reinstalar la CA. La instalación sigue requiriendo confirmación de Android. Servidores de ensayo cerrados; no se tocó la instalación real.

Cierre del canal: comprobada sin sesión la URL exacta `UpdateManifest.SOURCE`; respuesta idéntica a `updates/latest.json`, versión 0.7.0, versionCode 8 y SHA-256 final. Commit del canal `0562540fed9002dcd96bf4f96db544799503f44d` cotejado con main remoto; árbol de trabajo limpio antes de registrar esta evidencia. La revisión automática de permisos interrumpió un primer intento por límite de uso; se retomó después y la comprobación pasó. No se repitieron pruebas de código sin cambios.

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


## Cliente preferencial, tarjeta e ilustración · 0.8.0 · 13/11/2026

Corrección expresa del propietario, con prioridad sobre $60 y sobre la fracción preferencial de versiones anteriores: **Cliente preferencial = $10 por hora iniciada sin fracciones y $40 por tiempo libre**; normal permanece independiente. Casilla renombrada y ayuda limitada a la tarifa seleccionada. No se muestran fracciones/tolerancia en operación, tarjeta ni configuración. Las claves históricas se conservan para instantáneas y respaldos. Migración versionada/atómica `preferredFullHour` para entradas futuras y restauraciones antiguas, sin cambiar QR, pagos ni estancias abiertas. Sin nuevas reglas de jornada, pensiones o recargos.

Tarjeta HTML/PDF: únicamente normales; retirada la línea de jornada y la explicación del cálculo horario. «Lavados desde $120» seguido de «+$30 con estacionamiento tiempo libre», ambos desde configuración. El tiempo libre normal $50 permanece separado; el complemento de lavado sigue siendo otra modalidad y conserva la cobertura configurada. QR, tamaño bancario, margen blanco y cinco hojas Carta sin cambios.

Ilustración raster generada con **image_gen integrada**, sustituye SVG y Canvas de carritos/fachada. PNG transparente RGBA de 1774 × 887 píxeles, `web/assets/oeste-patio-pintado.png`; SHA-256 `491313987fe8987746c444518ebab882b1bb051c7b3dc474dacb2bcc962e1470`. Misma imagen en acceso/estado vacío web y cabecera Android, sin colocarla detrás de cobros. Se conserva la marca EO existente. Prompt exacto en evidencia privada `artifacts/Prompt-ilustracion-0.8.txt`. No se retocó la imagen mediante código ni se copió identidad de El Muelle.

Captura: ya conserva cofre, emblema y placa, con encuadre 4:3 consistente con el recorte. Prepara placa, propone color sólo si coinciden dos áreas de pintura y puede leer un nombre de marca escrito. Aplica los datos editables al formulario; conserva el servicio, cliente preferencial, tipo y observaciones. No registra entrada ni dinero al fotografiar. «Tomar foto» espera al inicio de cámara; el estado informa cuando el lector ya está preparado. Fotos/canvas y procesamiento sólo en RAM del teléfono; sin fotos a servidor, terceros, almacenamiento o Cloudflare.

**Solicitud pendiente: reconocimiento general de símbolos de marca.** La comparación de geometría con referencias se descartó al no distinguir con seguridad dos fotografías públicas de emblemas reales. No se distribuyen ese prototipo, sus referencias ni la biblioteca examinada. Leer un nombre escrito no equivale a reconocer el símbolo de Toyota/Honda; esa limitación aparece en la captura y README. Hace falta un modelo visual local validado y pruebas representativas. El muestreo de color es una sugerencia dependiente de encuadre/luz y requiere revisión. No se afirma reconocimiento completo, precisión física ni funcionamiento instantáneo.

Validación ejecutada para los cambios:

| Ámbito | Resultado |
|---|---|
| Java afectado | **349** comprobaciones aprobadas: 148 negocio, 42 requisitos, 11 persistencia, 33 normal/versionado, 40 cliente preferencial, 17 usuarios, 32 experiencia y 26 impresora simulada. Incluye bordes de hora, ambos lados del intervalo automático normal, precio fijo de tiempo libre, cambio, idempotencia, informe único, migración y restauración |
| JavaScript afectado | **18** pruebas aprobadas: 7 lector, 3 solicitudes, 2 caché, 3 muestreo/marca escrita y 3 PDF. Se rechazan nombres ambiguos/prefijos de placa, regiones de color discordantes/blancas saturadas y entrada insuficiente |
| HTTP | **17** comprobaciones aprobadas en base aislada `.dev/preview-v8`, nunca en la instalación real |
| PDF | Muestra sintética de cinco páginas Carta; primera tarjeta renderizada con Poppler y revisada. Texto nuevo sin tolerancia, jornada ni preferenciales; sin recorte ni solapamiento |
| Android | APK 0.8.0, code 9, compilada con JDK 21/SDK 35, firma v3 conservada y recursos/DEX cotejados con fuente final. No ejecutada en dispositivo. Instrumentación previa sin cambios; no se repitieron suites de TLS/canal/réplica sin cambios |

No se modificaron El Muelle, sus archivos, datos, CA, firma, permisos o USB. Pruebas físicas de cámara/colores, emblemas, HONOR/iPhone, impresora/báscula y Play Protect pendientes. Réplica de consulta sin despliegue nuevo.

APK final: **13,529,115 bytes**, SHA-256 `86e7e75f08c85b75efea3ba3d2043aebf92fcb82605c4e2da2de19b5516410e3`. Firma de actualización `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`.


Navegador: cliente preferencial en tiempo libre muestra $40. Captura integrada ensayada con un adaptador de vídeo sintético servido exclusivamente por el proxy de desarrollo: imagen en RAM con placa ABC123A, pintura roja y palabra FORD. OCR real de Tesseract preparó los tres campos (ABC123A/Ford/Rojo); aplicar datos conservó `mode=free` y `preferred=true`, total base $40. Es una simulación de interfaz/procesamiento; no acredita cámara, pintura real ni reconocimiento de símbolos. El adaptador de cámara y los datos de ensayo no forman parte de web/ ni APK. Un error inicial de sintaxis de ese adaptador privado se corrigió y se comprobó su sintaxis antes del ensayo final; no era código del producto.


Entrega 0.8.0: commit de implementación `9af1955d64abcc712a0f0c00ddbebb06871df6ea`, 28 archivos exactos revisados, publicado en main. [Prerrelease oficial](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.8.0) publicado tras cotejar digest/tamaño de assets; descarga pública sin sesión, TLS y redirección HTTPS autorizada comprobados. Archivo descargado idéntico byte a byte al APK firmado. Sólo entonces se prepara `updates/latest.json` para code 9. Misma firma/paquete/CA; instalar encima y recargar el cliente. Servidores de ensayo cerrados; no se abrió la instalación real. Reconocimiento general de símbolos de marca permanece pendiente y se declara en la versión; no se marca esa solicitud como cumplida.

Cierre del canal 0.8.0: commit `5fc359ae6e3b44f9587eec1bf3d06bbec66eddff` cotejado con main remoto. La URL exacta `UpdateManifest.SOURCE` respondió por HTTPS sin sesión con JSON idéntico al manifiesto local: versión 0.8.0, versionCode 9, tamaño y SHA-256 finales. Esta comprobación del canal no equivale a una instalación física.


## Operación mínima y 60 tarjetas · 0.9.0 · 15/11/2026

Por instrucción posterior del propietario: el ingreso habitual registra sólo placa, manual o mediante foto. Marca y color dejan de ser requisitos; no se inventa tipo de vehículo. Servicios especiales, cliente preferencial, pensiones, lavado y observaciones permanecen dentro de «Servicio y opciones». El lavado exige tipo explícito para aplicar su tarifa. Se conservan datos de contratos anteriores. La salida muestra total y botón «Confirmar pago y cerrar», sin recibido/cambio ni casilla adicional. Incidencias queda plegado; cancelar conserva autorización y motivo.

Los campos de motivo/importe adicional anteriores correspondían a coberturas indefinidas o excedidas. No se elimina esa restricción comercial: el empleado no puede resolverlas. El administrador puede autorizar expresamente el importe base sin cargo adicional con un botón; el servidor registra autor, decisión, incidencia y hora en auditoría. No se inventan jornadas, recargos ni periodos. API compatible con clientes anteriores que envían recibido; el flujo nuevo exige confirmación booleana de pago y total coincidente con el cálculo autoritativo. Cambio de importe requiere nueva confirmación. Se conservan transacción, idempotencia, reportes únicos, QR y pagos cerrados.

Inventario: 50 normales (01–50) y 10 provisionales (P01–P10, IDs 51–60). No se inventa vigencia o recargo para provisionales. Se añaden únicamente IDs faltantes y se conservan secretos/estados previos, incluidas reservas, suspensiones, extravíos y asignaciones. Una reserva antigua sigue requiriendo activación administrativa; no se reemite al imprimir. Migración atómica y restauración de respaldos completos de 35 o 60 tarjetas. Capacidad de 30 vehículos sin cambios. HTML/PDF: ocho hojas Carta, ocho tarjetas por hoja, medidas bancarias y QR vectorial/margen blanco conservados; sólo tarifas normales. Muestra de prueba con códigos inválidos, no PDF operativo en Git.

OCR vuelve a placa únicamente: retiradas carga de identificación de marca/color y guía de frente. Modelo fast local, recorte central, alfabeto de placas, preparación, timeout y alternativa manual conservados. Guía adaptada al mismo recorte vertical/horizontal. En ensayo, la segmentación dispersa 11 devolvió texto vacío sobre la placa sintética con marco oscuro; segmentación de una sola línea 7 devolvió ABC123A. Se aplicó modo 7 y se verificó la captura integrada: ABC123A, revisión y aplicación al campo de entrada. Son píxeles y cámara sintéticos en RAM de un adaptador exclusivo del proxy de ensayo; no acredita precisión, rapidez ni cámara física. No se distribuye el adaptador ni el diagnóstico. Por nueva instrucción, marca/color y reconocimiento de emblemas quedan fuera del lector actual.

Validación afectada: **381** comprobaciones Java aprobadas (148 negocio, 42 requisitos, 11 persistencia, 32 flujo mínimo/inventario/restauración, 33 horario, 40 preferencial, 17 usuarios, 32 experiencia y 26 impresora simulada). **16** pruebas JavaScript aprobadas (7 lector, 3 solicitudes, 2 caché y 4 PDF); tras el cambio de segmentación se repitieron sólo las 7 del lector y aprobaron. **17** verificaciones HTTP aprobadas contra `.dev/preview-v9` en loopback. Primer socket impedido por sandbox; repetido con autorización de conexión local. No se repiten TLS/réplica/fuentes sin cambios.

Navegador: entrada por número provisional P01 con placa sola; salida de $10 confirmada, tarjeta liberada y un pago. Fixture de 360 px, ancho útil 345/scroll 345 sin desbordamiento: OCR sintético aplicado, tiempo libre preferencial $40 conservado, cierre administrativo sin campos de importe/motivo y acumulado de ensayo $50 (dos pagos). Accesos, captura, aplicación y cobros revisados visualmente. Dos errores de MutationObserver se observaron en el entorno de revisión durante los sondeos DOM; no se atribuyen a una causa productiva sin traza. Los desplegables de servicio se observaron ordenados; no se presenta la consola de ese entorno como libre de errores. Evidencia privada: `artifacts/entrada-simple-0.9.jpg`, `salida-simple-0.9.jpg`, `entrada-360-SIMULACION-0.9.jpg`, `salida-cobertura-360-SIMULACION-0.9.jpg`.

PDF sintético: ocho páginas Carta exactas; extracción confirma 01–50 y P01–P10 una sola vez, sin preferenciales/jornada. Hojas 7/8 renderizadas con Poppler y revisadas sin recorte o solapamiento. Avisos de fuentes Symbol/ArialUnicode de Poppler no impidieron el render; texto de Helvetica/logo y QR se verificaron visualmente. Archivo marcado MUESTRA / NO VÁLIDO, fuera de Git.

Android: compilación separada con JDK 21/SDK 35, paquete mx.eloeste.servidor, versión 0.9.0/code 10 y firma v3. DEX y todos los recursos cotejados byte a byte con la fuente final. Sin claves, bases, QR operativos ni certificados de instalación en la distribución. CA/TLS, firma, permisos y datos existentes sin cambios. No se ejecutó instrumentación nativa ni instalación física; pruebas HONOR/iPhone, cámara real, impresora/báscula y Play Protect siguen pendientes. No se modificó El Muelle ni se desplegó la réplica Cloudflare.

APK final: **13,529,115 bytes**, SHA-256 `296da1fe94362128eb846e7848f6fcdf3c40fbfcb2c5f748a3196f0c54ccae95`. Certificado de firma conservado: `ae45ebb586679900420c15199a3d51fcdb8dd8686d2bfe844d8bc031687de325`.


Entrega 0.9.0: implementación `8c33c0e37b24b7790b94b8b43ff5ff200cebf2f0`, lista exacta de 21 archivos revisados y publicada en main. [Prerrelease oficial 0.9.0](https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/tag/v0.9.0), ID 446233025, publicada tras cotejar huella/tamaño de la APK subida. Descarga pública sin sesión verificada con TLS y redirección HTTPS autorizada; idéntica byte a byte a la compilación firmada. Sólo después se prepara el manifiesto para code 10. Misma firma, paquete y CA; instalar encima y recargar el cliente. Servidores aislados de ensayo cerrados; la instalación real no fue abierta ni modificada.

Cierre del canal 0.9.0: commit `dceb5e7ba298f5ca27d548e1518c052a8a73f416` cotejado con main remoto. Consulta HTTPS sin sesión de la URL exacta `UpdateManifest.SOURCE`: JSON idéntico al local, versión 0.9.0/code 10, tamaño y SHA-256 finales. Árbol de trabajo limpio antes de registrar esta evidencia. No equivale a instalación física.

## Servidor principal Cloudflare · 16/11/2026

Base de continuidad y main remoto comprobado: `59afcd3319cfa0310670f442a1e3e7b86546efb5`, árbol inicialmente limpio. Instrucción posterior del propietario: Workers + D1 principal + Static Assets, conservando reglas de 0.9.0 y Android separado. Implementado en `cloud/`; `web/`, `core/`, Android, réplica y canal APK conservados. No se ha hecho corte real ni importado una instalación operativa. Procedimiento y correspondencia de funciones en [CLOUDFLARE.md](CLOUDFLARE.md).

Por corrección expresa durante esta sesión, **no requiere Zero Trust, Access ni aplicación autenticadora**. Se retiró su dependencia y la solicitud de TOTP. Usuario/PIN más navegador autorizado para todos los roles; tokens aleatorios de 256 bits en cookies HttpOnly/Secure/SameSite, hashes en D1, CSRF, permisos y límites contra intentos repetidos. Solicitudes de teléfono nuevo se aprueban desde Equipo con una sesión administrativa ya autorizada; no habilitan sesión por sí mismas. Retirar un teléfono corta sus sesiones. No se vincula criptográficamente al hardware. Sin bloqueo por inactividad; máximo absoluto de sesión de 12 horas conservado.

El primer acceso del propietario se prepara con enlace privado de un uso y una hora; el propietario elige usuario/PIN, sin credenciales predeterminadas. La misma recuperación protegida conserva usuarios, PIN, QR y pagos de una importación existente. Marcador de uso, alta y autorización del navegador comparten batch. El enlace/QR de preparación queda sólo en `.dev/iniciar-el-oeste.html` y `.dev/cloud-setup-link.txt`, nunca en Git ni assets.

Integridad: importes en centavos; snapshots y versiones preservados. Guardas condicionales y restricciones/trigger en un batch D1 resuelven concurrencia de tarjeta, cierre, capacidad, revisión de usuario y tarifa. Pago único/inmutable por estancia o mensualidad. Reintentos retornan resultado persistido cifrado por usuario/clave; la huella es HMAC, no un hash rápido de PIN. Timeout/503 consulta el resultado y no afirma cobro ni fallo. Se conserva el formulario en memoria y se ocultan importes anteriores durante desconexión. Se corrigió que el finally del formulario volvía a habilitar su botón mientras seguía sin conexión. El reintento confirmado no vuelve a cobrar.

Respaldo cifrado independiente con snapshot D1 consistente y fragmentos por debajo del límite de fila. Restauración/importación exclusivamente a destino vacío/inactivo; no sobrescribe pagos posteriores desde el navegador. Preserva UUID de pagos, tarifas históricas, estancias y secretos QR; amplía 35 a 60 sin rotar códigos. No importa sesiones/autorizaciones de navegador. El destino productivo, congelación Android, conciliación final y activación de autoridad única siguen pendientes de datos y decisión del propietario.

Validación final afectada: **32 pruebas aprobadas**, cero fallos, `npm test` (46.08 s en esta ejecución). Incluye 1670 comparaciones exactas contra Java (102 horarios y 1568 cotizaciones), snapshots, coberturas, permisos, sesiones, CSRF/origen, revocación, inicialización privada, falla intermedia D1, respuesta perdida, reintento y cuota simulada. Prueba diaria de 50 vehículos y carga de **500 vehículos en grupos concurrentes de 20**, con 500 pagos únicos, saldos/ocupación conciliados. Esas cargas usan SQLite simulado; no son carga remota ni prueba física.

El **Worker completo empaquetado** se ejecutó en workerd con binding D1 local: alta privada sin autenticador, PIN, solicitud/aprobación de navegador, carrera por tarjeta, doble confirmación con un único pago y recuperación por identificador. Se verificó uso de `payments_actor_time` mediante EXPLAIN. Medición local final: entrada 14 consultas/27 filas leídas/19 escritas; cierre 13/23/22; reintento 2/4/0; estado 9/70/0. La simulación final de 500 vehículos ocupó 1,884,160 bytes SQLite. Son medidas locales, no CPU/facturación Cloudflare.

La prueba pública detectó un límite que workerd local no reprodujo: WebCrypto y la API Node nativa rechazaron PBKDF2 de 210000 iteraciones, devolviendo 503 cerrado. Categoría segura `CRYPTO_ITERATIONS`, sin exponer excepciones SQL/credenciales. Se incorporó **@noble/hashes 2.4.0, MIT**, sólo al Worker, conservando exactamente SHA-256/210000, hashes de PIN y formato de respaldo. Comparación independiente con Node nativo y simulación del rechazo de la API nativa aprobadas. La URL pública final verificó las credenciales de una cuenta sintética inexistente y devolvió el **401 esperado**, sin crear usuario, QR ni pago; 1054 ms de pared incluyendo red, no CPU. No se redujo seguridad para entrar en Free. CPU pública de autenticación/p95 y admisión sostenida en Free siguen sin acreditarse; no se contrató Paid ni se activaron cargos. La captura de métricas filtró en memoria los datos privados; sólo se conservaron categorías/estado/tiempos.

Navegador real de desarrollo con datos sintéticos: acceso, resumen administrativo, Equipo/alta de usuario con mayúsculas, pensiones y formulario, reportes/periodos, 60 tarjetas/ocho hojas, tarifas, respaldo, aplicación y periféricos. Entrada por placa, salida simple de $10 con un pago, desconexión/reconexión conservando placa y consulta pendiente. Flujo final sin autenticador: recuperación privada de navegador del propietario, PIN, solicitud de empleado, aprobación dentro de Equipo e ingreso posterior sólo con PIN. Composición de 360 px verificada: ancho útil/scroll 345 px, administración en dos columnas y controles medidos de al menos 48 px; diálogo de salida de 307 px, acciones de 108/151 px y 68 px de alto. Se observó también el diálogo a ancho de escritorio. Intentos posteriores de cambiar viewport a 390/tablet no produjeron ese ancho verificable: no se declaran esos tamaños revisados. La herramienta de navegador sufrió timeouts intermitentes; se comprobó estado antes de reintentar, sin repetir cobros. No se declara una consola libre de errores ni compatibilidad física a partir de esos ensayos.

Recursos EO, Rye/Manrope e ilustración original conservados; superficies de operación opacas y contraste reforzado, controles compactos y retiro de instrucciones locales en el cliente cloud. La PWA cambia su caché con la huella de assets y no almacena API ni fotos. Impresión pasa al diálogo del navegador sin duplicar pagos; USB/LAN directo y un puente opcional no se declaran implementados. El especialista no estuvo disponible: se siguió su dirección aportada por el propietario, **sin atribuirle una aprobación final**. Revisión de las nuevas pantallas de acceso/teléfonos, iPhone/Safari, tablet, teclado móvil, instalación PWA, cámara/OCR reales e impresión física pendientes.

Despliegue real en cuenta exclusiva `54600c17d459514351dc3e040a7271cf` (la cuenta confirmada por el propietario). Perfil Wrangler aislado de la cuenta global de otros proyectos. D1 `el-oeste-ensayo`, ID `d7552046-59b3-4236-b91c-ed9a904f064c`, esquema 0001 (27 comandos) y 0002 (6 comandos) aplicados. Worker y assets publicados en [URL de ensayo](https://el-oeste-ensayo.el-oeste-kingghidorahx12.workers.dev). Release de código comprobado `f9fcff17-e0ca-4724-8ca2-bd49dd4041e7`; tras cargar los Secrets de preparación, `/health` respondió 200 con `deploymentId=2bc58c0c-3182-4a23-a8de-07f223289379` y `/api/setup-status` 200, `available=true`, `mode=new`. `/api/state` sin sesión/navegador autorizado devolvió 401. La primera publicación de URL estuvo bloqueada por correo sin verificar (10034); el propietario lo verificó y se publicó. La dependencia Access se retiró por instrucción posterior, sin contratar Zero Trust.

Huellas SHA-256 de fuente final:

- Worker: `75ad18048b80b725f1b207147e3e55b6e220326299800bcab51864d0ed182795`.
- Criptografía: `8df43e5ffa3009eecaf51b525abf222a82c73a8b23f77ed73d310824954686af`.
- Reglas: `3befb54bedebf676b8196bc869fba203cc98b8b6a80a13f762e5cf0cae5c0e03`.
- Fixture Java sintético comprimido: `472610d65f749bfce4418d40d5762ba66cd726ae0777bd7d00c98d0829c3656c`.

Evidencia privada, excluida de Git: `artifacts/cloud-final-tests.txt`, `cloud-runtime-final.txt`, comparativas `cloud-antes-360-SIMULACION.png`, `cloud-admin-360-SIMULACION.png`, `cloud-entrada-360-SIMULACION.png`, `cloud-salida-360-SIMULACION.png`, `cloud-reconexion-SIMULACION.png`, `cloud-pin-sin-autenticador-SIMULACION.png`. La captura de desconexión inicial precede la corrección del botón; no se usa para acreditar su estado final. No se volvieron a ejecutar Java/Android/réplica sin cambios. No se modificó El Muelle, ni se publicó APK, Release o manifiesto Android.

Entrega de fuentes: commit `8d261bd8baa6d731ec50a4342080b2598f0c6d0b`, **46 archivos exactos** revisados y publicados en main del repositorio oficial; SHA remoto cotejado. Escaneo de los archivos preparados frente a las claves reales de servidor, OAuth y enlace privado: cero coincidencias. Se excluyeron `.dev`, datos, respaldos, certificados, QR operativos, node_modules y APK. El primer intento de commit/push no llegó a ejecutarse porque la revisión automática alcanzó su límite de uso; se retomó después de la hora indicada y se completó. No se repitieron pruebas de fuentes sin cambios.

Comprobación de continuidad del 16/11/2026: `/health` respondió 200 con el mismo despliegue `2bc58c0c-3182-4a23-a8de-07f223289379`; `/api/setup-status` respondió 200 con `mode=owner`, `available=false`. La instalación ya contiene el administrador; el enlace privado anterior ha vencido y no se renueva innecesariamente. El acceso habitual continúa en la URL pública con usuario/PIN y el navegador autorizado. Se conserva el carácter de ensayo; este cierre no acredita migración de datos reales, corte productivo ni pruebas físicas adicionales.


## Rediseño Cloud UI/UX · 16/11/2026

Instrucción del especialista aportada por el propietario: evolución visual y operativa del cliente Cloud, conservando la arquitectura y reglas vigentes. Base remota cotejada: `b491566e0617d4aea75fedbd4c5a05a0eb33a1e4`. Implementación: **`119d86f12131a0b96235731ef76b83ea04d5a464`**.

- Sistema ordenado en `cloud/style.css`, sin cargar `web/style.css` ni `web/atelier.css` en Cloud. Superficies cálidas, degradados de material, profundidad moderada, controles y estados compartidos. EO, Rye, Manrope y el PNG original se reutilizan; no se generó una ilustración nueva. Acceso/splash y colores PWA adaptados sólo en los assets Cloud.
- Cabecera de una línea, navegación compacta y operación con escaneo único que identifica entrada/salida. Filas con placa, tarjeta, modalidad, hora, importe base/revisión y salida. Sin barra fija que tape el teclado.
- Entrada con radios nativos accesibles en una cuadrícula; placa/foto y «Sin placas» juntos; preferencial fuera de los complementos, observación plegada y lavado contextual. Visita mensual desde contrato pagado vigente, fuera de las modalidades habituales. Preserva los datos previos del vehículo y el envío de `monthlyId`.
- Salida con identificación, total del servidor y confirmación; incidencias separadas. No añade efectivo recibido, cambio o motivo a la salida ordinaria. La revisión administrativa de cobertura y las cancelaciones mantienen sus autorizaciones.
- Administración con ingreso protagonista, ocupación/movimientos, desglose, módulos compactos, alertas, historial y gráfica de pagos reales; mantenimiento secundario. Equipo reorganizado, con teléfonos autorizados junto al título. Formularios, tablas, reportes, pensiones, tarjetas y periféricos reciben los componentes compartidos.
- Submitters, API, cliente de idempotencia, Worker/D1, configuración comercial, QR y OCR se conservan. Ningún cambio en `web/`, Android/Java, `remote/`, APK, Releases o `updates/latest.json`. No se ejecutó migración ni corte productivo.

Verificación focalizada final: `node cloud/scripts/assets.mjs` y `node --test cloud/tests/ui.test.mjs`, **7 pruebas aprobadas / 0 fallos** (última ejecución: 3.67 s). Comprueban el ensamblado literal del script, contratos de solicitud de entrada/salida, preferencial separado, cuatro lavados con complemento, cobertura pendiente, observación obligatoria sin placas y visita mensual. Son pruebas de controlador y serialización en VM, no pagos realizados mediante una pantalla física. No se repitieron suites de concurrencia, migración o carga.

Revisión en Edge de escritorio, datos exclusivamente sintéticos, misma base y hora fija para antes/después. El escenario usa el Worker real con SQLite en memoria; no accede a D1 remota. Se cargaron 14 vistas a 390 px y se midió el resumen antes/después a 360, 390, 768, 1024 y 1280 px: sin desbordamiento del documento, errores de ejecución registrados ni campos menores de 16 px; los objetivos medidos usan la etiqueta táctil para radios/checkboxes. Esta medición no certifica accesibilidad ni equipos físicos. Capturas durante la iteración en `.dev/ui-evidence/`: `comparacion-admin-360.png`, `antes-admin-360.png`, `despues-admin-360.png`, `operacion-entrada-salida-390.png`; medidas en `layout.json`. Se observaron cabecera/resumen, operación/entrada/salida y zonas de reportes/pensiones/equipo/tarifas. **No se completó toda la inspección visual interactiva:** la herramienta de Windows devolvió timeouts repetidos en `get_window_state`, `get_window`, `type_text` y `list_windows`, incluso tras recuperar ventana y reiniciar su sesión. No se acredita el select abierto, errores/desconexión ni teclado móvil con estas capturas. Cámara/OCR físicos, Safari/iPhone, PWA instalada, impresora y lectura al sol siguen pendientes. La simulación no acredita compatibilidad física ni convivencia con la báscula.

Publicado exclusivamente en [ensayo existente](https://el-oeste-ensayo.el-oeste-kingghidorahx12.workers.dev), versión **`cdcd03a9-e71d-46ba-a228-9f8d4e3b64ee`**. Wrangler informó cinco assets modificados y arranque de Worker de 2 ms; no equivale a latencia de operación. Se cotejaron por SHA-256 las cinco respuestas públicas HTTP 200 contra el build; `/api/state` anónimo mantiene HTTP 401. Sin cambio de planes, Access, autenticador, secretos o datos operativos.

Huellas públicas verificadas:

| Asset | SHA-256 |
|---|---|
| `index.html` | `aec440f202da482acdca4f19cce3894757ccc433d5b1fbb3443b1ac57b5e2e21` |
| `app.js` | `7534c63300973ae58bc7858426ce3f44c06e7684a92f50089765d82f5ffa7495` |
| `cloud.css` | `15a00ffa75b5f228b74a6fcd05b3f95787154dc13342b88bf94ce43d2f98ebf3` |
| `manifest.webmanifest` | `6004ee61fecd65dcbfbc610eb3d0ca63c34af614877217fce71bbdf1a3b27e46` |
| `sw.js` | `251d0abfc286c5e0e4d5b07812efadb85ebbab9feabd607096f135540ced0158` |


## Capacidad Cloud 60 · 16/11/2026

A petición del propietario, el indicador «Ocupados» muestra /60. Operación y resumen administrativo calculan disponibles y porcentaje con la capacidad publicada por el servidor. El límite transaccional y la conciliación de respaldos Cloud también quedan en 60; se conserva el inventario de 50 QR normales y 10 provisionales. Android histórico no se modifica. Implementación: commit `3d767c8`.

Validación focalizada: 8 pruebas UI aprobadas y una prueba de capacidad que admite 60 entradas concurrentes, rechaza la estancia 61, verifica el campo de capacidad del estado y concilia 60 estancias. Sin repetir suites completas de carga, precios o migración. Se aplicó únicamente `0003_capacity_60.sql` a la D1 de ensayo existente; la consulta remota confirmó la guarda >=60. Antes/después: una estancia, cero pagos, 60 tarjetas y una estancia activa, sin cambios en esos registros.

Publicado en el mismo Worker, versión `5299c6cd-b066-4df3-b7af-75eb9aca5a56`. Cloudflare informa ahora el subdominio configurado por el propietario: [El Oeste](https://el-oeste-ensayo.eloesteestacionamiento.workers.dev). Se actualizan esa referencia y la del preparador de acceso, sin ejecutarlo ni emitir otro enlace privado. Se conserva ENVIRONMENT=staging; no se activa producción.

Descargas HTTP 200 cotejadas byte a byte: `app.js` SHA-256 `c3ac6287e43decf3c523591380e484d2112d9c26235aee4e9e411427fbf6303f`; `sw.js` SHA-256 `b4acb5c24226fb2c04bde7f681cec489f8b92570cf9b79a48a3a4b52db7f647e`. Acceso anónimo a estado mantiene HTTP 401. Evidencia local en `.dev/ui-evidence/capacidad-60-publicacion.json`. No se crean nuevas estancias remotas para probar ni se acreditan pruebas físicas nuevas.


## Dirección gratuita definitiva · 16/11/2026

A petición del propietario se conserva workers.dev, sin contratar dominio ni plan. Dirección verificada: [El Oeste](https://eloeste.estacionamiento.workers.dev). El Worker existente se renombró mediante PATCH por su UUID `d5ca3e8d0f8c45ddaa90866ebb1ee08b` a `eloeste`; no se creó otro Worker, entorno ni base. La captura del propietario conservaba la ruta del nombre anterior del panel; se verificó primero que el recurso ya había pasado a `eloesteestacionamiento`.

El subdominio `estacionamiento` se comprobó disponible (10032). La API de registro rechazó sustituir el subdominio existente con 409/10036; el propietario lo cambió desde el panel y confirmó el resultado. Se verificó por API el nombre final y el subdominio. La autorización OAuth aislada se renovó automáticamente con Wrangler; no se solicitó otra autorización ni se usó un token global.

Se preservaron el identificador del Worker, la D1 `d7552046-59b3-4236-b91c-ed9a904f064c`, los bindings, las claves de datos y ENVIRONMENT=staging. El renombrado conservó la versión `5299c6cd-b066-4df3-b7af-75eb9aca5a56`; posteriormente sólo se renovaron BOOTSTRAP_HASH y BOOTSTRAP_UNTIL, mediante secrets-bulk parcial, para autorizar al administrador en el nuevo origen con su usuario/PIN existentes. Versión activa resultante: `acfbb611-f851-4051-b72e-c795de8b17f7`. No se ejecutó el alta/autorización del navegador ni se cambiaron usuarios, PIN, QR, estancias o pagos.

El enlace privado de un uso y una hora queda exclusivamente en `.dev/iniciar-el-oeste.html` y `.dev/cloud-setup-link.txt`; no se publica en Git ni assets. Estado público de recuperación: mode=owner, available=true al verificar. El propietario debe usar sus credenciales actuales; no se emiten credenciales predeterminadas ni se exige autenticador. La expiración concreta sólo se conserva en la evidencia privada `.dev/worker-rename-final.json`.

HTTP 200 y descarga de app.js idéntica al build, SHA-256 `c3ac6287e43decf3c523591380e484d2112d9c26235aee4e9e411427fbf6303f`; API de estado anónima HTTP 401. El cliente y las reglas, incluida capacidad 60, son los mismos; no se repiten pruebas de tarifas/carga ni se acreditan pruebas físicas nuevas. Se sincronizan el nombre en wrangler.jsonc y las referencias activas de acceso/despliegue; el nombre de la D1 permanece intacto. Las URLs de apartados anteriores se conservan como evidencia histórica. El cambio de dirección no supone corte productivo.


## Cámara y controles móviles · 16/11/2026

Solicitud del propietario a partir de sus capturas Android. Implementación: commit `663c18598f7cd3fd101ae4e45bfec627c9e5e96b`. El video QR recibía sus dimensiones intrínsecas porque no estaba dentro de la clase de cámara estilizada; ahora tiene clase propia, ancho contenido y altura acotada según el viewport, conservando el cuadro completo con object-fit:contain. No se cambia el decodificador, la captura OCR ni la clasificación servidor de entrada/salida. El formulario manual reserva el ancho de «Continuar» y los botones dejan de partir palabras; al abrir un modal se vuelve al inicio de su contenido. «Cliente preferencial» y su ayuda forman un grupo centrado.

Por petición expresa se retiran la franja y las referencias visibles de ensayo del acceso, inicialización y errores de configuración. ENVIRONMENT=staging y las guardas internas se conservan; no se realiza migración, corte de autoridad ni modificación de datos, QR, tarifas, permisos o credenciales. Android histórico y El Muelle no se modifican.

Validación focalizada: build y dry-run de Wrangler aprobados; 14 pruebas de UI/cliente aprobadas, cero fallos. Revisión en Edge Chromium sin ventana, con perfil separado y SQLite en memoria: escáner y entrada antes/después a 360, 390, 768, 1024 y 1280 px. Video sintético de dimensiones 720×1280, sin abrir cámara real. Las diez vistas nuevas medidas no desbordan horizontalmente, tienen controles medidos de al menos 48 px, campos de al menos 16 px y cero errores registrados. «Continuar» pasa de dos líneas a una a 360/390 px; el centro del grupo preferencial coincide con el centro del área visible (desviación máxima 0.008 px). Se inspeccionaron las capturas móviles de ambas comparaciones. Evidencia privada: `.dev/ui-evidence/mobile-fixes/scan-comparison.png`, `entrada-comparison.png` y `layout.json`. Esto acredita composición en navegador y simulación; no cámara física, OCR, Safari/iPhone, PWA instalada ni impresora. No se repiten suites de precios, carga, Java o Android sin cambios.

Publicado en [El Oeste](https://eloeste.estacionamiento.workers.dev), Worker existente, versión `9750336e-3809-4ef9-9769-c36479744a79`. Se revisaron nueve archivos exactos antes de publicar, con cero coincidencias de los valores privados locales en el diff. Wrangler actualizó cuatro assets. Descargas de app.js, cloud.css, cloud-client.js, sw.js, index.html y manifest.webmanifest: HTTP 200 y coincidencia byte a byte con el build; API de estado anónima: HTTP 401. Versión activa cotejada mediante /health. Evidencia privada: `.dev/ui-evidence/mobile-fixes/publication.json`. Sin cambios de plan, base, Secrets, APK o Releases.

| Asset modificado | SHA-256 público verificado |
|---|---|
| app.js | `4ebc21c76c724dc5964fe0683a02807c9407768b6f6026c10cae862a10f0e29d` |
| cloud.css | `1a6812887a0980f317a420ccb3ef703e44ee1d2856732d25ce497f925ffc205e` |
| cloud-client.js | `b23d0fb8b71b72850c8139c50602cdbac437ecd4323b3df9335acb90e096fec9` |
| sw.js | `cab4dd44c6eb359679860ffcda5ba0154272978579878baf44f512037e65cd50` |


## Administración y preparación de entrega · 17/11/2026

Implementación: `604129b1d533574b11076551e9dd7e8d0509979a`. Equipo distingue el navegador actual, fechas y referencias de autorización; permite aprobar/rechazar solicitudes, nombrar navegadores y retirar otros accesos. El ingreso permite dar un nombre opcional al dispositivo. No se deduce que autorizaciones con el mismo nombre sean el mismo teléfono físico.

Eliminar empleados u otros administradores retira sus sesiones, dispositivos y solicitudes pendientes, preservando identidad y movimientos históricos. La baja no se puede reactivar como un usuario meramente inactivo. Protecciones de cuenta propia y último administrador, incluidas guardas transaccionales frente a operaciones concurrentes. La sesión/dispositivo autorizado también se verifica dentro del lote de escritura, no sólo antes.

Aplicación ofrece limpieza manual de visitas, pagos y pensiones de prueba, con resumen, LIMPIAR y PIN del administrador. Sólo staging/cloud-test/sourceKind=synthetic. Preserva configuración, usuarios, autorizaciones y QR/bloqueos; libera tarjetas ocupadas. El permiso de borrar pagos se abre y cierra exclusivamente dentro del lote de limpieza; la inmutabilidad ordinaria permanece. El lote elimina resultados anteriores y eleva operationEpoch para bloquear reintentos/pantallas obsoletos. No se invocó esta función sobre la instalación remota ni se borraron usuarios.

Pruebas focalizadas: 17 de gestión/seguridad/cliente aprobadas, ocho de UI aprobadas (ensamblado final de ambos scripts vuelto a comprobar tras distribuir botones), conversión de respaldo e importación aprobada tras incorporar la metadata de época, e integración HTTP completa en workerd/D1 local aprobada. Incluyen autorización y retiro, baja de ambos roles, conservación de pagos, carrera entre administradores, PIN sólo en memoria, rollback de limpieza fallida, repetición idempotente, rechazo de pantallas anteriores y protección de pagos después de limpiar. Se adaptó el cargador de migraciones de los tests al formato de una sentencia completa por línea de D1 exec. No se repiten suites completas de precios/carga/Java/Android sin cambios.

Navegador: se revisaron los tres diálogos a 390 px con datos sintéticos y SQLite en memoria; sin desbordamiento horizontal, errores registrados, controles medidos menores de 48 px ni campos menores de 16 px. Capturas privadas `.dev/ui-evidence/management-20261117/devices.jpg`, `delete-user.jpg` y medidas `layout.json`. Los intentos de interacción CUA mediante AX, localizador y coordenadas devolvieron «Click target is no longer available»; no acreditan los envíos mediante esa interfaz. Las pruebas funcionales anteriores usan HTTP/VM/workerd. No se acreditan teléfono físico, Safari/iPhone, PWA instalada, cámara o impresora nuevos.

Se revisaron 19 archivos exactos antes de publicar y se cotejaron con los valores privados locales: cero coincidencias. Se comprobó por API el Worker existente eloeste/`d5ca3e8d0f8c45ddaa90866ebb1ee08b` en la cuenta autorizada, usando exclusivamente OAuth aislado. Aplicada sólo `0004_management.sql` a la D1 existente; publicada versión `3a6c7d98-6b55-4d7e-8a8e-52395a3b4960` en [El Oeste](https://eloeste.estacionamiento.workers.dev). Health HTTP 200 y versión cotejada; estado anónimo HTTP 401. Seis descargas públicas HTTP 200 idénticas byte a byte al build.

Antes/después coinciden los conteos de usuarios, dispositivos, visitas, pagos, pensiones, tarjetas, versión de tarifas y saldo. Época 0, ninguna guarda de limpieza abierta y ningún usuario eliminado. Evidencia privada `before-db.json`, `after-db.json`, `verification.json`, `worker.json` y `publication.json` dentro del mismo directorio de evidencia. No se activó producción ni corte, ni se cambiaron Secrets, planes, Android, APK, Releases o El Muelle.

| Asset modificado | SHA-256 público verificado |
|---|---|
| app.js | `5d580e97d7837d24e080fd6c9361dc3627071ae272636997493a866af4bfceb9` |
| cloud-client.js | `f2ef72827b4fb3d307b433d88cebb22c0b681d9f31371b4a895b8b67a0b3ece1` |
| cloud.css | `3fa1498172ce509397e12ac19e36b43010c0a96c385c88abb12e293c79efd955` |
| index.html | `e30cd85a64ade7007653cae4cfc06f598979090549069965a9b0e40668d09f69` |
| sw.js | `85ea2606d71568a9057ff451ca63a8d6db73d1f20dcc5066d09e9f5baf7e52e3` |


## Acceso del administrador, interfaz final y lectura de placas · 20/11/2026

Código: `32a0e28cde89a55a3d7faec58905408a5c0d8e1c` y `4c634e03d790e8a0d228c78ced1f2022a7913eb6`. Se conservaron y sincronizaron las fuentes existentes de baños y tarjetas; no se cambiaron sus tarifas ni se ejecutaron limpiezas. Se revisaron 29 archivos exactos y luego los ocho de la corrección de alias; sin claves privadas en los cambios preparados. El borrador previo `web/ocr.js` queda fuera de estos commits, sin alterarlo. Cloud sobrescribe expresamente ese asset con su propio adaptador; no depende del borrador histórico.

Aplicación deja de mostrar preparación de entrega o limpieza de pruebas. Se retiran su formulario y acción de la interfaz; se conservan las guardas internas y no se presume producción. El acceso distingue nombre visible de usuario para entrar, con `login_name` separado de `users.name`, que sigue identificando a los actores históricos. Los cambios propios de usuario/PIN conservan la sesión aprobada que los guarda, cierran las otras y no amplían su duración absoluta. Se evita perder la consulta de una operación incierta tras cambiar el acceso.

Se verificaron dos causas del bloqueo: el formulario anterior sólo cambiaba display_name y el identificador solicitado pertenecía también a una cuenta eliminada. `0007_current_login_uniqueness.sql` limita la unicidad a perfiles no eliminados; la autenticación excluye los eliminados. Se mantiene la cuenta original y su historial, sin borrar ni reactivar la archivada.

Recuperación ejecutada únicamente sobre el administrador identificado, con guardas de id/revisión/rol, derivación PBKDF2 SHA-256/210000 y auditoría en un lote. Antes se comprobó en Cloudflare real el formato de batch y rollback mediante una clave temporal de intentos, sin operaciones de negocio. Los primeros lotes se rechazaron por la reserva del alias eliminado y revirtieron; no hubo actualización parcial. El PIN se recibió sin eco por stdin y sólo residió en memoria, sin archivo ni incorporación a Git. La respuesta real de login HTTP 202 confirmó las credenciales y que seguía siendo necesaria la aprobación de navegador. La solicitud sintética se marcó denegada; no se autorizó un navegador nuevo. Los conteos/saldos de estacionamiento y baños, pensiones, tarjetas/revisiones, dispositivos y versión de tarifas se conservaron. No se registran aquí las credenciales ni identificadores personales. Evidencia privada: `.dev/account-ocr-20261120/account-verification.json` y `before-db.json`.

OCR Cloud: adaptador propio en `cloud/ocr.js` basado en el flujo local previo, conservando el modelo fast y los bundles LSTM/SIMD fijados. `cloud/ocr-camera.js` alinea el rectángulo mostrado con la imagen realmente recortada, incluida la adaptación a video vertical. Prioriza el número frente a textos secundarios sin eliminar separadores, y limita la alternativa de segmentación antes de volver a la siguiente foto. No infiere marca/color; las imágenes quedan en RAM y el usuario confirma la placa.

Validación: 22 pruebas focalizadas de acceso/conversión/inicialización/UI/OCR aprobadas; nueve pruebas finales del adaptador OCR y validación del ensamblado del cliente aprobadas; integración HTTP en workerd/D1 local con cambio real de usuario/PIN aprobada. La regresión de alias eliminado también pasó después de añadir la migración 0007. No se repitieron suites completas de precios, carga o Android. Dos pruebas del OCR histórico fallaban con su borrador previo; no se usan para acreditar Cloud ni se modificó ese borrador para hacerlas pasar.

Navegador aislado: motor WASM real con la CSP del Worker, imagen ficticia generada en RAM, lectura de una línea y lectura con texto secundario aprobadas, cero infracciones CSP. Resultado en `ocr-after.json`; la duración observada no es una promesa de velocidad en teléfono. Los recursos públicos del motor y modelo se cotejaron con los locales; su compresión no presentó diferencias. La revisión automática rechazó leer una ventana personal de Edge por posible exposición de otras pestañas; se usó un perfil de prueba aislado. No se acredita cámara física, precisión real de placas, HONOR/iPhone/Safari, PWA instalada ni impresora.

Aplicadas sólo las migraciones pendientes 0006 y 0007 a la D1 existente; 0005 de baños ya estaba aplicada. Worker/UUID y cuenta autorizados conservados, OAuth exclusivamente aislado. Versión final `afd6e85b-439a-4321-8c91-ddb7220e6605` en [El Oeste](https://eloeste.estacionamiento.workers.dev). Health HTTP 200 con versión cotejada, estado anónimo HTTP 401. Nueve assets públicos HTTP 200 idénticos al build; la última publicación de backend no cambió assets. Evidencia en `publication.json`, `ocr-engine.json`, `ocr-after.json` y `worker.json` del mismo directorio privado. Sin cambios de planes, Secrets, El Muelle, certificados, APK o Releases; sin corte de autoridad.

| Asset modificado | SHA-256 público verificado |
|---|---|
| app.js | `f5af54b0fe24c7184b0ac5f4841ba0b1aa476e707d7610b06943d039c2755c65` |
| cloud-client.js | `f70bc8349e4fed8cdf9a9bac67501c96b1a8d0a59b6f41ab6881d5548d53435f` |
| cloud.css | `9f1ea78757b3c6282ea61b7537cab3834764ee96978862db9ddd344cc4ab3a26` |
| ocr.js | `909c6a0b95d5538de7c5da25efce6b636190543345818760c2d5d95e8733e71d` |
| sw.js | `b8d7a74a1812604b8c9e0b0e7a7ef1ce99cc90dce212d71d1e45b292505f6539` |


## Corrección de nombre de acceso y pantallas anteriores · 20/11/2026

Commit de código: `9c5eb808c1a6f95339c8a38c783fba389d156588`. Siete archivos revisados: `cloud/lib/api.mjs`, `cloud/ui.js`, `cloud/scripts/assets.mjs`, `cloud/app-update.js`, `cloud/sw.js`, `cloud/tests/login-change.test.mjs` y `cloud/tests/app-update.test.mjs`. Borrador histórico `web/ocr.js` preservado y excluido.

La consulta real confirmó el problema reportado: el nombre visible cambió, pero el identificador de entrada anterior permaneció. El formulario antiguo sólo enviaba displayName; el servidor antes lo trataba como un cambio exclusivamente visual. Se añadió compatibilidad para que ese renombrado también cambie el acceso, con validación previa a modificar el PIN. Equipo ahora tiene un solo campo Usuario, con mayúsculas visibles y acceso normalizado, manteniendo users.name como identidad histórica.

La cuenta afectada se reconcilió mediante lote D1 con guardas de identidad/revisión/unicidad y auditoría. No se pidió ni restableció el PIN nuevo; hash y salt comparados sólo en memoria permanecieron iguales. Identidad histórica, agregados de visitas/pagos/baños/pensiones/tarjetas/configuración, navegadores y vencimientos de las sesiones existentes conservados. No se almacenaron hashes ni credenciales en evidencia o Git. Evidencia privada: `.dev/ui-access-20261120/login-repair-result.json`.

La URL seguía sirviendo los assets previamente publicados, lo que no acreditaba la pantalla abierta del teléfono; se corrige esa limitación de verificación. HTML, scripts y CSS usan una misma revisión; SW Cloud separado, caché vigente y actualización diferida mientras haya formulario/operación. Una pantalla abierta antes de este mecanismo requiere recarga inicial; no borrar cookies ni datos.

Validación: 17 pruebas enfocadas aprobadas (renombrado nuevo/antiguo, rechazo atómico de nombre inválido, sesiones/seguridad, UI y actualización), dry-run Wrangler aprobado e integración HTTP workerd/D1 aprobada. La primera ejecución de workerd recibió EACCES de red loopback del sandbox; repetida con permiso de ejecución local, pasó. En Edge headless con perfil aislado y datos ficticios: formulario de un solo nombre → guardar nombre/PIN → salir → acceso viejo HTTP 401 → entrar con nombre/PIN nuevos; nombre mostrado y acceso coinciden. Vista Aplicación renderizada sin entrega/ensayo/prueba. Resultado privado: `browser-result.json`; no se acredita una prueba física del teléfono ni una captura de pantalla nueva. OCR no se modificó ni se repitieron sus pruebas.

Publicado en el mismo Worker y D1, versión `35515981-676b-4a69-b9e9-70336f923121`, interfaz `dfc9643cebaaaea2`. Health 200; estado anónimo 401. Nueve assets públicos idénticos al build y tres URLs versionadas HTTP 200 cotejadas. Acceso y nombre visible actuales conciliados en D1; no se probó el PIN real nuevo por desconocerlo. `publication.json` y `deployment.txt` conservan evidencia privada. Sin migraciones, limpieza de registros, corte de autoridad, cambios de planes/Secrets, Android, APK, Releases ni El Muelle.

| Asset | SHA-256 público |
|---|---|
| index.html | `df3b5372c57eb81c2edf27708f342b201797209cc974a460d224c9265002dbc5` |
| app.js | `06bea90bf422cc01665767d24a00668fa282fc2de5e2674744651123abb6e4f5` |
| cloud-client.js | `3e1e18d9cc007095775b50913c70b813515939340cb9d736fd79003b1ec3b7e2` |
| sw.js | `43a72e1a9c3b5946a7ade56d78cbf02d34d2cec872e38d467a826e78187fd2a8` |


## Reiniciar datos: función conservada con textos neutrales · 20/11/2026

Aclaración del propietario: quitar referencias a entrega/ensayo no significaba retirar la función. Commit `bc2018d1f0a409aaa8d04ff2b8a0e9f3e119fda5`, tres archivos revisados: `cloud/management.js`, `cloud/lib/management.mjs`, `cloud/tests/reset-ui.test.mjs`. Aplicación vuelve a ofrecer Actualizar aplicación y Reiniciar datos. Este último mantiene resumen, confirmación LIMPIAR y PIN administrativo. Con cero datos la opción sigue visible deshabilitada con texto neutral. También se neutralizaron mensajes visibles del servidor; endpoints, permisos, guardas, transacción e idempotencia se conservaron. La aclaración sustituye la retirada anterior de la UI; AGENTS.md no se modificó.

Cinco pruebas afectadas aprobadas: dos de UI, dos de reinicio/guardas/rollback y una de privacidad del PIN. Dry-run Wrangler aprobado. Integración en Edge headless aislado, con Worker y SQLite locales y datos ficticios: abrir opción → resumen/PIN → confirmar → visita ficticia eliminada → 60 tarjetas y tres usuarios conservados → opción visible deshabilitada. Evidencia privada en `.dev/reset-ui-20261120/browser-result.json`. No se ejecutó reinicio alguno en Cloudflare, ni se cambió PIN, usuarios, QR o configuración reales; el borrador histórico OCR permanece intacto y fuera del commit.

Publicado en Worker existente, versión `16dc3607-1158-4f37-a9d0-bb67fdd843eb`, interfaz `d309a44dfa8b1fed`. Health 200; estado anónimo 401. Cuatro assets idénticos al build y URL de controlador versionada cotejada; opción presente y títulos anteriores ausentes. Evidencia privada en `publication.json` y `deployment.txt` del mismo directorio. Sin migraciones, planes nuevos, Secrets, APK, corte de autoridad ni cambios en El Muelle; no se acredita prueba física del teléfono.

| Asset modificado | SHA-256 público |
|---|---|
| index.html | `5b2d79c7943099f28ffc3d9469e9aee973b8db35350f38ce411350d5b057444f` |
| cloud-client.js | `b7a2583212e0164d67ff79d1cc8efec412d3c2176c73e111d0c3d44fff84cd50` |
| sw.js | `2d25eb5d801139acc6b7de601f9a7598be10d5fca2089d7b0bcd2f71890c7368` |

## Catálogo configurable, Presidencia y eventos · 23/11/2026

Código publicado: `63460574aceb7a88da2b291f48ade61ef6e0123d`. Revisados los 23 archivos exactos de Cloud del commit y su diff preparado, sin valores de Secrets ni tokens. El borrador previo `web/ocr.js` permanece sin modificar y fuera del commit; el build usa expresamente el OCR de Cloud. Android, réplica, APK, certificados, Releases, manifiesto de actualización y El Muelle no se modificaron.

Tarifas pasa al menú principal de administración y reúne Normal, Preferencial, Presidencia y Eventos. Catálogo de servicios y tipos de vehículo con alta, edición y retiro, precios por perfil/evento, estacionamiento incluido/opcional y complementos. Los cambios versionan entradas futuras; no reescriben estancias abiertas ni pagos. Lavados conservan bases aprobadas, agregan Moto/$100 y permiten el complemento opcional de $30 o incluir estacionamiento en el precio. Baños normal/$7 y Presidencia/$5. Las modalidades mensuales de $500/$600 quedan pendientes de asignación humana por tipo de vehículo, sin condiciones nocturnas inventadas.

Entrada ordenada tarjeta → placa → perfil/persona → servicio/opciones → confirmar. Seleccionar una tarjeta manualmente no registra entrada. Placas de Presidencia preseleccionan persona/perfil; cambiar la placa limpia elecciones dependientes. Salir a cuenta libera vehículo/tarjeta sin registrar efectivo. Cargos, pagos y asignaciones se guardan por lote D1 con idempotencia, guardas de saldo/revisión y registros monetarios inmutables. Abonos parciales se asignan en orden y sólo los pagos recibidos entran al reporte del cobrador. El pago de una mensualidad parcialmente abonada muestra el saldo restante y rechaza una confirmación desactualizada.

Pensiones 12 h/$50 y 24 h/$60, desde entrada. Mensualidades de 30 días exactos, fecha/hora explícitas y aviso configurable, inicialmente tres días. Un contrato pendiente no habilita acceso; crédito de Presidencia exige registro explícito. Saldo vencido mantiene la base original y acumula bloques cortos/largos de pensión, sin convertir mensualidades en estacionamiento. Estacionamiento que permanece tras cerrar añade pensión nocturna y vuelve a cobro horario al abrir. Horario inicial 07:00–20:00 editable. Eventos conserva precio de entradas anteriores y amplía su cobertura; sólo entradas nuevas reciben precios de evento desde activación, inicialmente hasta 03:00.

El acceso recuerda nombres autenticados por navegador, sin guardar PIN. Comprobar dispositivo muestra versión/capacidades localmente y se incorporan alternativas para funciones ausentes de navegadores anteriores. Reiniciar datos se conserva con título neutral y las mismas restricciones; incluye las tablas monetarias nuevas, sin ejecutarlo sobre Cloudflare. OCR normaliza letras/números y matrículas partidas en renglones; conserva modelo fast local, fotos sólo RAM, lectura alternativa acotada y revisión manual.

Validación: suite completa de 70 pruebas aprobada durante la implementación; después, 19 comprobaciones focalizadas de catálogo/UI/acceso recordado/migración aprobadas. Tras los últimos ajustes de importes y guardas: build y dry-run aprobados, siete pruebas de catálogo y una integración HTTP completa en workerd/D1 aprobadas. La integración cubre autorización de navegador, concurrencia, pago único, cierre a cuenta y abono. No se repitieron Java, Android o réplica sin cambios.

Edge headless aislado, Worker/SQLite locales y datos ficticios: flujo principal completo con entrada manual sin registro automático, placa asociada, cierre a cuenta sin ingreso, abono, tipo nuevo, reinicio neutral y acceso con usuario recordado. Revisión avanzada aprobó mensualidad pendiente/pago/visita sin base duplicada, eventos con precios antes/después, cobertura a las 02:00, noche/reapertura, vencimiento mensual de 13 horas con sólo $60 de pensión, y creación/cobro/reporte de servicio nuevo. Anchos 360/390/768/1280 sin desbordamiento horizontal. Dos errores encontrados en la revisión (submit interceptado y contrato sin preselección) se corrigieron antes de publicar. Evidencia privada: `.dev/catalog-20261123/browser-result.json`, `browser-extended-result.json` y capturas del mismo directorio. La herramienta CUA no respondió y se usó Edge de prueba, sin acceder a pestañas personales.

Motor OCR WASM real con CSP del Worker, imagen ficticia en RAM: lectura de una línea y texto secundario aprobadas, cero infracciones CSP; `ocr-browser-result.json`. Estos resultados no acreditan cámara física, precisión en placas reales, PWA/WebAPK instalada, Moto e5 Plus/Android 8, HONOR, iPhone/Safari ni impresora. El cierre nativo reportado del acceso instalado en Moto sigue pendiente de comprobación en ese teléfono; no se declara resuelto por una simulación.

Aplicada únicamente `0008_catalog_accounts.sql` a la D1 existente. Worker `eloeste` y UUID `d5ca3e8d0f8c45ddaa90866ebb1ee08b` verificados mediante OAuth aislado. Versión `fa41ed70-951c-451c-b6e9-d83af15dd68e`, interfaz `460ef67b2228524b`, en [El Oeste](https://eloeste.estacionamiento.workers.dev). Catálogo persistido como versión 6 en lote guardado, huella `0db7cb45b7f28a83b49a7793d51419a553458073b0dcd5bb63e5f11c20b04740`. Conciliación antes/después conserva conteos/revisiones/saldos de negocio, usuarios, dispositivos y tarjetas. Autoridad/origen permanecen iguales; no se ejecutó limpieza ni corte productivo, ni se cambiaron PIN, planes o Secrets. Evidencia privada: `remote-before.json`, `config-activation.json`, `deployment.txt` y `publication.json`.

Diez assets públicos y tres URLs versionadas HTTP 200 idénticos al build; health devuelve el identificador publicado y estado anónimo HTTP 401. Huellas SHA-256 públicas:

| Asset modificado | SHA-256 |
|---|---|
| index.html | `e6ae8332ca17b24ff465dd18a87a66089f20481009abfa2e93b23373d38413b7` |
| app.js | `d2d398ea23c127276ac5911c62afa31ab4ead7ad6d2b4817c2b3f6fe00ddcaec` |
| cloud-client.js | `14ed616e019db31ae67e0f22338250f0bc58220177584bde9304ef1edcf793ac` |
| cloud.css | `014e0663103d3195f705e23b731605672524676452fa76585215f11f44e3ec43` |
| sw.js | `7126c2d3d1bb89c99028488affb75c7fd0d54e9a5591ab16e0163212c76dcefa` |
| ocr.js | `19106d052ebc109a2e95afb94e8f593ef18d6e2181389d19d9e092bf26d69ea8` |
| compat.js | `d5d711e66ccd28ccd993b6ed5d0e1a2af07808b0a59901465738aa86f3b1d54f` |

## Composición, cámaras y corrección de horario · 23/11/2026

Código: `28dda9c5f5337d274994258e576d73c2300827ed` (ocho archivos Cloud revisados) y `eb91536a959dc31e637389bc885627dcd011fb71` (catálogo y prueba de regresión). El borrador previo `web/ocr.js` permanece intacto y excluido. Videos, capturas, fotos ficticias, tokens, configuración privada y datos no forman parte de los commits. Sin cambios en Android, APK, Releases o El Muelle.

El video mostró que el catálogo había generado tres hijos dentro de una fila diseñada para cuatro columnas: la placa quedaba en una columna de tarjeta y se partía. El resumen también colocaba tres métricas en una rejilla de dos columnas. Se corrigieron las estructuras y su distribución, con placas de 22–25 px y totales destacados. Encabezados y controles centrados; formularios y campos acotados; columnas por ancho, ajustes de tarifas distribuidos y controles con objetivos táctiles de al menos 48 px. Cancelar en Servicios tenía acción de cerrar diálogo aunque estaba en una página; ahora navega fuera sin enviar. Se añadió la misma salida a la entrada pendiente y Baños.

Por nuevas instrucciones del propietario, Operación retira Servicios y conserva Clientes y saldos centrado. Baños vuelve a cantidad de personas y confirmar cobro: $7 para todos, sin seleccionar perfil, servicio, forma de registro ni casilla adicional de pago. El precio único se configura en Normal y prevalece sobre diferencias de perfil/evento. Ajuste remoto específico guardado como versión 7; conciliación antes/después conservó registros, cargos, pagos, inventario y autoridad. Evidencia privada: `.dev/layout-20261123/config-activation.json`.

Entrada: placa → cliente/persona → tipo de vehículo → servicio filtrado → confirmar. No muestra servicios hasta seleccionar tipo; ofrece sólo modalidades generales y las asignadas al vehículo elegido. Cambiar el tipo limpia una selección incompatible y sus complementos. Los contratos mensuales vigentes conservan el tipo registrado como dato explícito. Se mantienen tarifas y permisos.

QR pasa a viewport completo, sin franjas laterales ni selector manual duplicado. La detección usa el mismo recorte que el video mostrado. Cerrar o resolver tarde un permiso no deja streams activos. Placas abre la captura nativa de imagen con cámara trasera y después muestra OCR local, recorte y campo de confirmación/corrección. La foto queda en RAM; canvas y URL blob se liberan al cerrar/usarla. No cambia el motor/modelo OCR ni sube fotografías.

Validación: 26 pruebas afectadas de catálogo/UI/OCR aprobadas; dry-run e integración HTTP completa en workerd/D1 aprobados. Tras la instrucción de filtrar por vehículo, ocho verificaciones del ensamblado/UI aprobadas. Tras corregir la inicialización del horario, nueve pruebas de catálogo aprobadas, incluida la regresión de una entrada a las 15:28. No se repitieron Java, Android, réplica ni la suite completa sin cambios.

Edge headless aislado con Worker/SQLite y datos ficticios: 14 pantallas y 16 combinaciones adicionales de ancho/página, a 320/360/768/1280 px; sin desbordamiento horizontal. Cancelar en Servicios, entrada pendiente y diálogos de servicio/tipos/eventos/mensualidad/cliente/salida/anulación/extravío/usuario/reinicio no alteró registros ni dinero. Baños con dos personas confirmó un pago de $14 sin campos adicionales. Evidencia privada: `browser-result.json` y capturas del mismo directorio.

Prueba adicional de navegador: QR completo en vertical/horizontal, sin selector repetido; streams detenidos al cerrar y después de permiso tardío. Tipo de vehículo antes del servicio, lavado de Auto/Camioneta filtrado y selección incompatible limpia. Captura nativa solicitada mediante atributo explícito; cancelación sin pantalla intermedia. Entrega de imagen ficticia al selector, OCR WASM real, revisión manual, aplicación a la placa y liberación de canvas/URL, sin registrar entrada ni dinero ni subir imagen. `camera-result.json`. No acredita la cámara física ni la apertura real de la aplicación de cámara de Android/iPhone; el selector nativo se simuló. El cierre de la instalación Moto/Android 8 continúa pendiente de comprobación física.

Segundo video: Por hora sí se guardaba como tal, pero el catálogo había heredado apertura 08:00/cierre 12:59. El cálculo trataba entradas de las 15:28 como pensión nocturna de $50. La inicialización ahora usa el horario confirmado 07:00–20:00; los catálogos ya configurados mantienen futuras ediciones. Se corrigió la configuración actual como versión 8 y, en un solo lote con guardas de versión/revisión/estado/servicio, cinco estancias abiertas que tenían exactamente ese horario erróneo. Se conservaron servicio, precios, hora de entrada y tarjetas; cada cambio quedó auditado. Tres eran horarias. Lectura posterior verificó los cinco registros y la conservación de importes base e inventario. Sin reiniciar datos ni alterar pagos cerrados o autoridad. Evidencia: `schedule-before.json`, `schedule-repair.json`, `schedule-verification.json`.

Se identificó un cargo cerrado de la tarjeta 29: $50 registrado y $10 correspondiente al tiempo y horario corregidos, sin resolución administrativa previa. Se conserva intacto, pendiente de decisión administrativa; no se generó devolución ni se reescribió su pago.

Publicación final: mismo Worker/UUID y D1, OAuth aislado, versión `4e4add5c-d345-4b1a-b3ca-6908088c4ce1`, interfaz `33e2893c05a31b71`, en [El Oeste](https://eloeste.estacionamiento.workers.dev). La publicación previa de interfaz fue `903b76e7-4ed9-495a-adde-ebdbfc994348`; el último despliegue sólo actualiza la inicialización del servidor y no cambia assets. Sin migraciones SQL adicionales, planes, Secrets, corte de autoridad ni cuentas/PIN modificados. Evidencia: `deployment.txt`, `publication.json`.

| Asset público modificado | SHA-256 |
|---|---|
| index.html | `47c993088aedea8d6ef7f58daffad4cf3c34004ef1eda7bae26085567f7aa9da` |
| app.js | `ac44949ffd2c30049b42fb9ece70ad17899d2d06830b9259e907549d5b712849` |
| cloud-client.js | `f735563d717fed15ee0f87bc428406d155735123426faf17525ec9403e8d92f9` |
| cloud.css | `4b7185206a623618220e2d27255e2bb2bf6c36ddea447d24de92c2747d3bfce7` |
| sw.js | `4ade31f23939488041421760392f07bbe2678a4b7482f8f42c41af0f569be8d7` |


## Tarifas por servicio, tipos de cliente y evento en Resumen · 23/11/2026

Código: `2dee6c7359e814a1615dc1baf3729459b5706288` incorpora evento desde Resumen y eliminación segura de catálogos; `a83f392ac2fcd7bc583bee126e9cd396f5a46e19` reorganiza Tarifas por servicio y añade tipos de cliente configurables. Revisados los cinco archivos exactos de cada commit de código y su diff preparado; comprobación final contra los valores de Secrets/OAuth sin coincidencias. El borrador anterior `web/ocr.js` se conserva fuera de estos commits; la compilación integra `cloud/ocr.js`. Sin cambios en Android, réplica, El Muelle, APK, Releases, certificados ni manifiestos de actualización.

Tarifas abre Estacionamiento, Lavados, Pensiones, Baños, Eventos, servicios fijos como Extravío, Tipos de vehículo, Clientes y Agregar servicio. Cada servicio filtra por pestañas de cliente. Baños tiene apartado propio y conserva un único precio de $7 para todos; cambiar la pestaña no crea descuentos. Horarios/cierre están en Estacionamiento; aviso y saldo vencido, en Pensiones. Se conservan las superficies, tipografía e identidad EO, con opciones centradas en 2/3/4 columnas según ancho.

Clientes dentro de Tarifas administra tipos, separados de las personas de Presidencia. Permite agregar, renombrar, activar/desactivar y eliminar; Normal permanece activo como base. Los nuevos tipos heredan Normal hasta ajustar sus precios por servicio y permiten seleccionar el esquema horario. No se añaden derechos de crédito: a cuenta continúa limitado a Presidencia. Los desplegables de mensualidades y servicios muestran únicamente tipos activos, ordenados alfabéticamente, con Normal seleccionado al abrir. El acceso de un contrato mensual pagado vigente se conserva si se retira su tipo; las visitas abiertas y sus precios congelados también se conservan.

Eliminar servicios/tipos conserva sus identificadores, precios e historial mediante tombstone. Se impide retirar el último tipo de vehículo/servicio horario y las pensiones todavía referenciadas. Quitar el único vehículo aplicable suspende los servicios dependientes y exige reasignar antes de reactivar. Aplicar al catálogo prepara el borrador; Guardar cambios lo confirma mediante versión, guardas y auditoría transaccionales. No se modifican entradas anteriores ni pagos cerrados.

Resumen ofrece Activar/Finalizar modo evento y usa precios guardados sin guardar otro borrador pendiente. La reactivación del mismo día conserva cobertura y rechaza un cierre desde un diálogo de una fase anterior. Se retiraron los botones duplicados de Operación y Baños de Resumen; permanecen las pestañas superiores y Baños en Operación.

Pruebas afectadas: 23/23 en catálogo, eliminación, tipos de cliente e interfaz; tras el ajuste final de desplegables, build y 8/8 de interfaz. Integración HTTP del Worker real en workerd: 1/1, cubriendo acceso propio, permisos, concurrencia e idempotencia de pago. Dry-run satisfactorio. La integración local no acredita límites CPU de Cloudflare ni hardware físico.

Navegador Edge aislado con Worker/SQLite y datos ficticios: `.dev/config-20261123/browser-result.json` y `final-result.json` verifican evento, reactivación, cancelación, eliminación y alineación. `.dev/services-20261123/browser-result.json`: 38 capturas y 20 comprobaciones de distribución en 320/390/768/1280 px, alta/precios/retiro de un tipo de cliente, cobro exacto y uso de su contrato mensual vigente tras retirarlo, y alta de servicio con sección propia. `selectors-result.json`: dos capturas finales y comprobación de desplegables alfabéticos, sólo activos y selección Normal. Sin errores JS ni desbordamientos horizontales en esas pruebas. Las primeras aperturas aisladas no conectaron a tiempo; la ejecución completada por CDP y la comprobación final sí pasaron. No se comprobó cámara, PWA, impresora ni teléfono físico en este ajuste.

Publicación intermedia `b38286b2-70f3-4340-9fa3-57c5dbff2b1f`; publicación final `15e4a4b6-2909-45ef-b77a-697a060907e3`, interfaz `a33c5253e8a9dc5e`, en [El Oeste](https://eloeste.estacionamiento.workers.dev). Verificada cuenta autorizada y Worker existente UUID `d5ca3e8d0f8c45ddaa90866ebb1ee08b`, con D1 original. Lectura previa confirma configuración versión 8. Sin migraciones SQL, cambios de precios/datos operativos, activación real de eventos, eliminación real de catálogos, reinicio, cambio de autoridad, Secrets, cuentas/PIN, planes o cargos. Los tipos iniciales se completan al leer el catálogo anterior y se persisten cuando el administrador guarda una versión.

Verificación pública: versión de `/health` coincidente; diez assets y tres URL versionadas idénticos a la compilación; `/api/state` anónimo devuelve 401. Evidencia privada: `.dev/services-20261123/{review,target,deployment,publication}`. OCR y tarjetas mantienen sus huellas previas. Los archivos de evidencia y perfiles aislados no se incluyen en Git.

| Asset público modificado | SHA-256 |
|---|---|
| index.html | `e77db6cfb47b1ce07f9aa8d3db0475d71b5f0f6a5bf734224b8607bee56cddf9` |
| app.js | `4eb2caf82df0a52f9487c02e12f0d49319cc03ba87a407a9589ee6c17438505a` |
| cloud.css | `267b164ea174323964b1ef52aa3a6d7e6d55265f71ed41104a2da62f1c0221c4` |
| sw.js | `364452a3156f332e92361aa85b06486705113aee3acbe2221fc2a2010d55cbc0` |


## Anulación administrativa de cargos sin abonos · 23/11/2026

Código: `f386dd85e400d2dfa738213b2f7809c5499fedec`. Revisados los once archivos exactos de Cloud, incluidos migración y pruebas, y el diff preparado contra valores reales de Secrets/OAuth sin coincidencias. `web/ocr.js` permanece como borrador anterior sin modificar ni incluir. Sin cambios en Android, El Muelle, APK, Releases o certificados.

La cuenta ofrece Anular cargo sólo al administrador en cargos de servicio a cuenta sin abonos, con motivo y confirmación. El registro deja de sumar al saldo y pasa a historial de anulaciones. Cancelar vuelve a la cuenta sin cobrar ni anular. Se conservan cargo original, estancia cerrada, tarjeta y pagos. Las mensualidades y los cargos con abonos no se anulan por esta vía. `charge_voids` es inmutable, referenciada al cargo; guardas del lote y triggers impiden la carrera cobro/anulación. Se integra con balances, respaldos, conciliación/importación y reinicio existente, sin ampliar la autorización de éste.

29/29 pruebas afectadas: anulación sin ingresos, administrador/motivo/importe, abonos parciales protegidos, rollback, respuesta perdida/idempotencia, carrera contra abono, conservación de estancia e importación de respaldo, catálogo y mantenimiento. Dry-run y 2/2 integraciones reales locales de workerd/HTTP con migración nueva. Edge aislado con datos ficticios: seis capturas a 320/390/768 px, motivo obligatorio, Cancelar sin cambio, saldo cero, historial e ingresos intactos; sin desbordamientos ni errores JS. Tras el ajuste de alineación se reconstruyeron assets y se repitió sólo esa revisión visual. No se probaron cámara, PWA, impresora o teléfono físicos en este ajuste. Evidencia privada en `.dev/charge-void-20261123/`.

Se verificó el Worker existente y su UUID `d5ca3e8d0f8c45ddaa90866ebb1ee08b` en la cuenta autorizada. La única migración pendiente fue `0009_charge_voids.sql`; se aplicó correctamente a la D1 original antes del despliegue. Publicación `d6c5cb7b-0523-444e-984b-a5240a3fb06b`, interfaz `fead3965eb79070b`, en [El Oeste](https://eloeste.estacionamiento.workers.dev). Diez assets y tres URL versionadas idénticos al build; acceso anónimo a `/api/state` 401.

Por solicitud expresa del propietario se identificó el único cargo indicado de $35, del 23/11 a las 16:53, sin abonos y con estancia cerrada. Después de publicar se anuló exclusivamente ese UUID mediante la misma lógica Api/Transaction, usando el perfil OAuth aislado, hora D1 y un identificador idempotente persistido de forma privada. El adaptador remoto limitó las tablas mutables a operations/tx_guard/charge_voids/audit. Lectura posterior: saldo de esa cuenta $0, ningún pago recibido, cero asignaciones al cargo, una anulación y una auditoría. Cargo original, estancia cerrada y todos los registros financieros previos permanecen idénticos. No se eliminó la persona ni se reiniciaron datos. Sin cambios de tarifas, horarios, autoridad, cuentas/PIN, Secrets, planes o cargos de Cloudflare. No se incluyen en Git nombres, claves de operación ni el UUID del cargo real. Evidencia: target-before/operation/resolution, migration/deployment/publication y review en la carpeta privada.

| Asset público modificado | SHA-256 |
|---|---|
| index.html | `315f6ec2449a736f991abb3883a019a272e0f1f07511911335acb4bb81503f77` |
| app.js | `de6a1fdda228175e29146e88aecfae1bd94471bd346062a575a88c64aabbc8cf` |
| cloud.css | `059cb59ffda02ae0d0be962af5ca232d8fa9c9bebaccb5ce897799e659312e87` |
| sw.js | `10361948b4f736fbdc186e44ac7013c6b4f5e16314867fdac7ef1abd665fe867` |

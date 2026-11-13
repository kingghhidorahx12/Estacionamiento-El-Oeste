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

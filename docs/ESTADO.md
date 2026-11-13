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

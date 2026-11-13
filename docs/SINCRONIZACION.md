# Consulta remota Cloudflare

La tablet es la autoridad. Esta réplica sólo recibe movimientos financieros ya confirmados y ocupación; no abre/cierra estancias, modifica tarifas ni registra cobros desde Internet.

Preparación con la cuenta del propietario:

1. Crear D1 y reemplazar `REEMPLAZAR_CON_ID_D1` en `remote/wrangler.jsonc`.
2. Ejecutar `remote/schema.sql` sobre esa base. Es un esquema inicial; si ya existe una instalación, usar una migración explícita y no borrar datos.
3. Configurar una aplicación Cloudflare Access para el panel del Worker. Autorizar sólo al propietario mediante su identidad con MFA/passkey según su proveedor. Reemplazar `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` por los valores reales de Access. El Worker valida firma, emisor, audiencia y caducidad del JWT; una cabecera inventada no autentica.
4. La ruta exacta `/ingest` debe llegar al Worker sin el inicio de sesión interactivo de Access. Esa excepción requiere una política explícita y queda protegida en el Worker por un secreto aleatorio `SYNC_TOKEN` de al menos 32 caracteres. No exponer otras rutas ni usar un PIN como secreto de Internet.
5. Guardar el secreto con el administrador de secretos de Workers, nunca en `wrangler.jsonc` ni Git. Publicar mediante Wrangler desde `remote/`. No se incluyen claves de cuenta ni un despliegue fingido.
6. En la app nativa de la tablet, desbloquear configuración, abrir **Opciones avanzadas** e introducir la URL HTTPS exacta `https://HOST/ingest` y su token. Los reintentos no requieren intervención de los empleados.

El Worker acepta lotes de hasta 50 pagos. Valida conceptos, centavos y conciliación. Los identificadores de pago son inmutables y se deduplican por instalación e ID; época/secuencia detectan conflictos de orden. Una restauración conserva IDs históricos y abre una nueva época para futuros pagos. Un lote sólo se confirma tras verificar los registros guardados. La tabla remota nunca se usa para autorizar una salida.

Si la réplica tiene información posterior a una copia antigua restaurada, no se borran automáticamente esos ingresos remotos. Recuperar primero una copia local reciente o conciliar administrativamente la diferencia; no inventar anulaciones ni ocultar pagos. El panel indica antigüedad y hora de confirmación, no afirma ocupación en tiempo real.

Verificación de puesta en servicio: enviar un pago de ensayo identificado, repetir el lote, comprobar un solo ingreso, interrumpir Internet dejando el Wi-Fi activo, registrar movimientos localmente y comprobar la reconciliación al reconectar. Probar que un visitante sin Access y un cliente sin token no acceden. Estos pasos necesitan la cuenta Cloudflare y el entorno real; las pruebas unitarias de este repositorio no sustituyen esa puesta en servicio.

Consultar los límites vigentes de [Workers](https://developers.cloudflare.com/workers/platform/pricing/) y [D1](https://developers.cloudflare.com/d1/platform/pricing/) antes del despliegue. No se promete servicio ilimitado ni gratuidad permanente. Las cuotas y fallos remotos no afectan entradas ni cobros locales.

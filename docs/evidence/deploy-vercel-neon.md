# Evidencia de publicación · Vercel y Neon

29/10/2026 · NotariaOS0.7.0. Autorización expresa para GitHub, base Neon y proyecto Vercel; no para integraciones legales o fiscales reales. [Guía](../deployment/VERCEL-NEON.md), [ADR0011](../adr/0011-vercel-neon-y-migraciones-de-release.md).

## Ejecutado

Repositorio [clixwebs/notaria](https://github.com/clixwebs/notaria), inicialmente vacío, publicado en `main`. Vercel enlazado y despliegues READY; dominio canónico [notariaos.vercel.app](https://notariaos.vercel.app/acceso). Proyecto Neon nuevo, PostgreSQL17, rama producción y QA separada. Migraciones1–11 aplicadas mediante comando de release, sin DDL durante peticiones. Sin migrar datos o clave PGlite.

Se aprovisionó solo la cuenta administradora indicada por el usuario, con contraseña aleatoria en archivo local ignorado y TOTP aún pendiente de configurar. No se activó un autenticador en nombre del usuario. Producción:1 cuenta,0 personas,0 expedientes,0 documentos privados y0 cuentas QA. El repositorio excluye claves, variables, bases, respaldos y archivos temporales de administración. Escaneo previo del primer commit:482 archivos/44556010bytes,0 coincidencias de credenciales conocidas y0 rutas privadas; las fuentes y evidencias adicionales posteriores también se revisan antes de subir.

## Pruebas ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Build Next/TypeScript/lint | Correctos |
| Unitarias | 52 correctas |
| PostgreSQL QA, verificación enfocada final | **8 correctas**,0 fallos/omitidas/reintentos |
| HTTPS producción | Login200, conexiónNeon disponible, API anónima401 |
| Cuenta real inicial | Login correcto; sinTOTP los datos siguen bloqueados403; sesión de comprobación cerrada |
| Bootstrap público | Rechazado403 |
| Permisos efectivos del rol runtime | Sin superusuario/CREATEDB/CREATEROLE/CREATEschema |

La suite enfocada prueba11 migraciones existentes sin DDL, denegación de CREATE, autenticación/TOTP, reservaPLAFT/origen, concurrencia idempotente porUUID, presupuesto0.10×3=0.30, archivo privado en cuarentena/liberación/bytes exactos, auditoría append-only, rollback nativo, creaciónUI bajo latencia remota y logout. Se ejecutó con `notaria_runtime`, sin membresía neon_superuser.

JSON finales: [resumen](deploy-summary.json), [QA enfocada](deploy-neon-focused.json), [producción](deploy-vercel.json). Capturas: [login HTTPS](deploy-vercel-login.png), [expediente QA PostgreSQL](deploy-neon-expediente.png).

## Intentos conservados y alcance de la regresión

La evidencia histórica local de fase6 conserva52unitarias/83E2E. **No se afirma83E2E remotas correctas.** El intento completo enNeon pasó16, falló1 y no ejecutó66: aserciónUI local de5s mientras el expediente continuaba cargando. [Intento](deploy-neon-intento-tiempo.json). Configuración de cloud con espera30s y verificación enfocada final cubren esa creaciónUI, sin modificar el dominio para superar el test.

Dos intentos enfocados iniciales conservaron3 correctas/1fallo/4noejecutadas: comparación incorrecta del cuerpo de respuesta idempotente (el contrato conserva elUUID, no todos los campos de respuesta) y un requestId adicional no admitido en el comando de presupuesto. Se corrigieron las aserciones/entrada de las pruebas, sin debilitar validación del servidor. [Respuesta](deploy-neon-focused-intento-respuesta.json), [contrato](deploy-neon-focused-intento-contrato.json). Final8correctas en una sola pasada.

La API Neon creó inicialmente roles con membresía elevada. La inspección SQL lo detectó; se crearon roles limitados medianteSQL y se eliminaron los provisionales antes del cierre. Vercel usa la conexión limitada, TLSverify-full, secreto nuevo y URL cifrados. No recibe tokens de administración Vercel/Neon o credenciales propietarias.

## Límites conservados

Sin RENIEC/lector, firma criptográfica, presentación SUNARP, CDR verificado, emisión SUNAT o formato oficialSBS/OCP. Publicación de revisión no acredita operación notarial, seguridad externa, carga, recuperaciónNeon/RPO/RTO o políticas jurídicas. Archivos menores a4MB enVercel por límite de peticiones. No se ejecutaron scripts sobre `.notaria/` activa ni se crearon cuentasQA en ella. Las pruebas de nube usan la ramaNeon QA; PostgreSQL admite sus conexiones independientes sin compartir una carpetaPGlite.

Cierre de código verificado: be6836343e8e44f91dd928c2fc38011d5ea83c68, Vercel READY/dpl_wRbS6RdybfuMJTpVct8A89W6DyJ2. Revisión HTTPS/login repetida sobre esa versión con etiquetas de revisión actualizadas. QA3101 detenida; revisión local3100 reabierta con su base original, Windows24328/sesión60384. La actualización documental posterior no cambia el código de aplicación.

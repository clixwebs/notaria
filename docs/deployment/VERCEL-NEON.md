# NotariaOS en Vercel y Neon

29/10/2026. Publicación expresamente autorizada por el usuario. Una notaría, entorno de revisión; no habilita las integraciones legales pendientes.

- Aplicación: [notariaos.vercel.app](https://notariaos.vercel.app/acceso).
- Fuentes: [clixwebs/notaria](https://github.com/clixwebs/notaria), rama `main`.
- Alojamiento: [Vercel / CLIX / notariaos](https://vercel.com/clixws/notariaos).
- Base: proyecto Neon `frosty-truth-22823896` (`notariaos`), PostgreSQL17, región AWS Ohio. Rama producción `br-calm-water-b55d1nru`; QA `br-mute-feather-b54xgffv`.

## Acceso inicial

La cuenta administradora se aprovisionó con el nombre y correo confirmados. Su contraseña aleatoria está en el archivo local `.env.access.local`, ignorado por Git. No pegar ese archivo en issues o documentación. Al ingresar, configurar TOTP, guardar los códigos de recuperación y cambiar la contraseña desde Seguridad. Ningún autenticador se activa por el desarrollador para la cuenta del usuario.

La web mantiene bloqueado el bootstrap público y el registro libre. Sin TOTP no se accede a datos. El resto del personal se crea desde Configuración mediante la cuenta administradora ya protegida.

## Releases posteriores

1. Preparar y revisar la migración aditiva. Ensayarla primero en una rama QA nueva o aislada; no crear cuentas QA en producción.
2. Ejecutar `scripts/migrate-postgres.ts` desde una terminal autorizada con conexión propietaria y `NOTARIA_MIGRATE=1`, secreto del entorno y URL explícitos. No guardar valores en Git ni usar el rol de runtime para DDL. La migración no se ejecuta durante build o peticiones web.
3. Desplegar a través de `main` cuando el esquema sea compatible. Vercel usa únicamente el rol `notaria_runtime`, secreto de autenticación y URL canónica. No rotar el secreto de autenticación sin un plan de sesiones/TOTP; no copiar claves de la instalación local.
4. Comprobar HTTPS, inicio de sesión/TOTP, permisos, errores y operaciones afectadas. Las previews carecen de conexión productiva; cualquier QA necesita su propia conexión/secreto y origen autorizado.

No usar `backup-local.ts`/`restore-local.ts` con Neon: esos comandos son de PGlite. El respaldo y recuperación de Neon requieren su procedimiento propio y ensayo antes de un piloto operativo. Conservar por separado la instalación local y sus respaldos; este despliegue no migra sus datos.

## Variables y archivos

Vercel almacena cifradas `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NOTARIA_URL`. `VERCEL` es proporcionada por la plataforma. No configurar `NOTARIA_MIGRATE` en funciones. No hay claves administrativas de Vercel/Neon en el runtime. Para este alojamiento, usar archivos privados menores a4MB por el límite de la función; la capacidad local de5MB no amplía el límite del proveedor.

Las credenciales entregadas en el chat no deben conservarse en el historial del repositorio; se recomienda rotarlas después de finalizar el despliegue. La contraseña inicial es un secreto distinto y no se publica.

[ADR0011](../adr/0011-vercel-neon-y-migraciones-de-release.md) registra las decisiones y límites. La evidencia del despliegue diferencia la regresión histórica local, el intento remoto detenido por timeout y las comprobaciones enfocadas finales.

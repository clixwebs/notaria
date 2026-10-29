# ADR 0011 · Publicación autorizada en Vercel y Neon

29/10/2026 · NotariaOS0.7.0. El usuario autorizó expresamente crear la base Neon, subir el repositorio `clixwebs/notaria` y crear/publicar el proyecto Vercel. Esta autorización sustituye la prohibición anterior de publicación **solo para este alojamiento**. No autoriza RENIEC, SUNARP, SUNAT, firma real o comunicaciones externas.

## Decisiones

- Repositorio indicado por el usuario, inicialmente vacío, publicado en `main`. Se conserva todo el historial documental/evidencia de ingeniería, con datos QA sintéticos. `.notaria*/`, respaldos, variables, claves, archivos temporales de administración y dependencias locales excluidos. Escaneo de credenciales antes de subir.
- Proyecto Neon nuevo `notariaos`, PostgreSQL17, región `aws-us-east-2`, rama `production` y rama nueva QA separada. No se migraron datos o claves de la instalación PGlite, ni se tocaron otros proyectos Neon. Producción inicia con esquema vacío y una cuenta administradora solicitada por el usuario; sin personas/expedientes QA.
- Vercel proyecto `notariaos`, equipo CLIX, GitHub enlazado y despliegue desde `main`, Node24 y funciones en `iad1`. URL canónica HTTPS `https://notariaos.vercel.app`. Previews no reciben la conexión de producción.
- Variables de producción cifradas en Vercel: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NOTARIA_URL`. Las claves de gestión Vercel/Neon no forman parte de esas variables ni del repositorio. Se genera un secreto de autenticación nuevo, independiente de PGlite y QA. TLS de PostgreSQL `verify-full` y conexión agrupada.
- El rol `notaria_runtime` se crea mediante SQL sin superusuario, creación de bases/roles, membresías elevadas o CREATE en esquema público. Solo recibe permisos de tablas/secuencias necesarios para la aplicación. Se comprobaron los permisos efectivos. Los roles provisionales creados por API Neon heredaban `neon_superuser`; se reemplazaron y eliminaron antes del cierre. El propietario de migraciones no se usa en Vercel.

## Migración y arranque

`platform.ts` no crea carpetas en modo PostgreSQL. En Vercel exige base, secreto y URL explícitos; nunca cae a PGlite. Con PostgreSQL, el arranque web solo comprueba las11 migraciones; no ejecuta DDL ni migraciones de Better Auth. `NOTARIA_MIGRATE=1` únicamente desde el comando explícito `scripts/migrate-postgres.ts`, fuera de Vercel, antes del release. El comando y el runtime usan credenciales distintas. El modo local PGlite conserva su inicialización anterior.

Se aplicaron las migraciones1–11 a las dos bases nuevas antes de servir peticiones. No se insertaron casos o políticas de ejemplo. Las versiones/bytes privados persisten en PostgreSQL, sin escritura al disco efímero de funciones.

## Alta inicial y acceso

Alta única mediante `scripts/provision-admin.ts` desde terminal autorizada, con el nombre/correo confirmados por el usuario y contraseña aleatoria. La contraseña se entrega en archivo local ignorado; no en fuentes, registros, URLs o documentación pública. El endpoint de bootstrap web sigue bloqueado fuera de localhost. La cuenta inicial exige configurar TOTP antes de leer datos. La revisión de producción prueba login y el bloqueo TOTP sin inscribir un autenticador en nombre del usuario. No existe contraseña administrativa pública o prellenada.

## Límites

Publicar el entorno de revisión no habilita operación notarial. Se mantienen simuladores y dependencias de fases5–6, reserva PLAFT y permiso por servidor. La base nueva no incorpora los datos de la instalación local. No se acredita piloto, revisión externa de seguridad, carga, RPO/RTO o retención jurídica. Los límites de peticiones de Vercel pueden rechazar cargas cercanas al máximo local de5MB; usar archivos menores a4MB en este alojamiento hasta implementar un canal privado de carga dedicado.

Ver [guía de despliegue](../deployment/VERCEL-NEON.md) y evidencia de despliegue. Las pruebas históricas locales de83 escenarios se distinguen de las ejecutadas sobre Neon; no declarar una regresión completa remota verde cuando no ocurrió.

Fuentes técnicas consultadas: [API Vercel, proyectos](https://vercel.com/docs/rest-api/projects/create-a-new-project), [API Vercel, despliegues](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment), [Neon, creación de proyecto](https://neon.com/docs/reference/api/projects/create-project).

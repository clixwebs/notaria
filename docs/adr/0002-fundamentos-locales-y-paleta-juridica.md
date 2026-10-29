# ADR 0002 — Fundamentos locales y paleta jurídica

29/10/2026 · Decisión aplicada para la entrega local de fase 2.

André autorizó continuar la fase 2 y conservar la interfaz de ELDIAL, **con negros y azules**. Esta instrucción reemplaza el requisito anterior de conservar su rojo, manteniendo Montserrat, composición del login, recurso de presentación Clix, barra superior compacta y componentes. No implica recuperar la antigua propuesta de navegación lateral de escritorio.

## Autenticación y autorización

Se adopta Better Auth 1.7.14 con contraseña, TOTP, códigos de recuperación y sesiones persistentes. La aplicación no implementa sus propias primitivas criptográficas. Alta pública deshabilitada en la frontera HTTP: el registro solo es invocable desde instalación local inicial o por administración autenticada. El primer administrador elige sus credenciales; no existen credenciales operativas por defecto.

No se permiten datos de personas, documentos o configuración modificable antes de verificar TOTP. Cada operación consulta habilitación/perfil y alcance en servidor. La cookie no funciona como caché de permisos. Sesiones de ocho horas sin renovación; acciones de administración, revisión de cuarentena y auditoría requieren sesión creada hace menos de quince minutos. Cambiar perfil/habilitación revoca sesiones. Administración no autoriza instrumentos notariales: esa operación real sigue pendiente de fase 3.

No se habilitan dispositivos de confianza, desactivación de MFA por HTTP, OAuth, registro abierto ni recuperación por correo sin proveedor configurado. Los códigos recuperan el segundo factor; la recuperación por pérdida de contraseña requiere un procedimiento administrativo posterior, previo al piloto.

## Persistencia

No se encontró PostgreSQL de servicio ni Docker en el equipo. Se utiliza PGlite 0.5.13 en el servidor Node, con archivos bajo `.notaria/`, fuera de `public/`, y Kysely 0.29.7. Es PostgreSQL embebido para una instancia local de prueba y **un proceso propietario**. No abrir el mismo directorio con dos procesos, ni hacer copias mientras el servidor lo usa.

El adaptador `pg` permite configurar `DATABASE_URL` para un servicio PostgreSQL independiente. Ese adaptador está implementado y tipado; no se ha ensayado contra un servicio externo. No se aprovisionó alojamiento ni se usó ninguna BD de ElDial. Prisma era candidato, no un requisito: se eligió Kysely por el adaptador compartido con Better Auth y PGlite.

El arranque local aplica migraciones de autenticación y dos migraciones propias. En despliegue operativo se debe separar la ejecución revisada de migraciones, usar un rol de aplicación limitado y ensayar las actualizaciones. Las futuras cantidades financieras usarán `numeric`/decimal y cadenas API: no se convierte el libro demo en contabilidad real en esta fase.

## Documentos y evidencia

Los bytes privados se guardan en `bytea` con metadatos, persona, oficina, versión y SHA-256. Límite: 5 MB; PDF con cabecera válida o TXT UTF-8. Toda carga queda en cuarentena. La liberación manual exige permiso, sesión reciente y constancia; no sustituye un antivirus. El archivo se entrega como descarga, con `no-store`, `nosniff` y comprobación de permiso/estado.

Las versiones detectan concurrencia, conservan los bytes anteriores y tienen un trigger que impide modificar sus bytes/metadatos o borrarlas. La revisión se registra una vez. El almacenamiento de objetos, antivirus, cifrado gestionado, retención y conservación legal se concretarán antes del piloto; `bytea` simplifica la recuperación local actual.

Cambios del núcleo y auditoría se confirman en la misma transacción; las lecturas sensibles se registran antes de devolver contenido. Un fallo del registro crítico revierte el cambio. La auditoría no guarda contraseñas, claves TOTP ni contenido de documentos y rechaza UPDATE/DELETE. No se afirma resistencia frente a un administrador de la BD ni existencia de puntos de control externos. Los intentos de autenticación registran la acción antes de delegarla; no se presentan como prueba de login exitoso.

## Fuentes técnicas consultadas

- [Better Auth: PostgreSQL y dialectos](https://better-auth.com/docs/adapters/postgresql), [otros dialectos](https://better-auth.com/docs/adapters/other-relational-databases).
- [Better Auth: sesiones](https://better-auth.com/docs/concepts/session-management), [TOTP y recuperación](https://better-auth.com/docs/plugins/2fa), [límites](https://better-auth.com/docs/concepts/rate-limit), [migraciones](https://better-auth.com/docs/concepts/database).
- [PGlite: persistencia](https://pglite.dev/docs/), [Kysely](https://pglite.dev/docs/orm-support), [API](https://pglite.dev/docs/api).
- [Next.js: autenticación y autorización cerca de los datos](https://nextjs.org/docs/app/guides/authentication).

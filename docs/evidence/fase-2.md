# Evidencia de fase 2

29/10/2026 · Entorno local Windows/Node 24.20.0 · NotariaOS 0.2.0.

## Ejecutado

| Verificación | Resultado |
| --- | --- |
| `npm run build` | Correcto: rutas dinámicas protegidas y API de autenticación/plataforma |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto, sin advertencias en la ejecución final |
| `npm test` | 11 pruebas correctas: ocho reglas de dominio demo y tres grupos de política/validación |
| `npm run test:e2e` | 14 pruebas correctas en 13,4 s; [JSON](fase-2-e2e.json) |
| Integridad y restauración aislada | Ocho controles correctos; [JSON](fase-2-restauracion.json) |
| CLI de copia/restauración | Copia creada desde QA detenida y restaurada en un directorio nuevo; no se sobrescribió ninguna BD |

Pruebas HTTP y de navegador sobre una instancia independiente en `127.0.0.1:3101`, con base `.notaria-qa-07`. Las cuentas y claves TOTP de QA no pertenecen a la instalación de revisión `3100`; no se guardaron claves/cookies/códigos en capturas o trazas. Los directorios privados y copias están excluidos de Git.

## Comportamientos observados

- Rechazos sin sesión, sin TOTP, con origen distinto y para registro HTTP público.
- TOTP verificado desde la API y desde el formulario real; alta inicial única y cuentas por administración.
- Creación/duplicado de persona y dos ediciones concurrentes: una confirma y otra recibe conflicto.
- Cuarentena bloquea descarga; revisión libera; descarga exacta con cabeceras privadas y como adjunto.
- Nueva versión conserva los bytes de la anterior; falso PDF rechazado.
- Caja recibe 403 al pedir personas, archivo por ID o auditoría. Cambio de perfil invalida su sesión.
- Código de recuperación funciona una vez; revocación y cierre invalidan acceso en servidor.
- Configuración con revisión obsoleta recibe conflicto; eventos de lectura/cambio aparecen en auditoría.
- Persistencia al recargar, diálogo con Escape y navegación sin errores JavaScript en las pantallas cubiertas.
- Tres recorridos completos del prototipo bajo autenticación: compraventa, certificación/carta y búsqueda/filtros/tablero.
- Axe sobre personas a 1440/683/390 px, tema oscuro a 390 px y acceso a 1440/390 px. Sin infracciones detectadas en esos estados ni desbordamiento global en los tamaños de personas comprobados. No es una declaración completa WCAG ni prueba de zoom real.

El ensayo SQL confirma rechazo de UPDATE de auditoría, cambios de bytes y DELETE de versiones. Un fallo deliberado al escribir auditoría revierte la inserción de persona de esa transacción. La instantánea recupera una persona, dos versiones y 66 eventos; los SHA-256 de los bytes restaurados coinciden. La copia incluye la clave local para recuperar el entorno de autenticación.

## Correcciones durante la validación

Se corrigieron la apertura de solicitudes Next/Request al delegar autenticación, el orden de migraciones antes de comprobar el esquema, la ejecución de sentencias de migración por separado y reglas de tabla heredadas que ocultaban columnas de acción en móvil. El ensayo de copia usa la apertura estándar documentada de PGlite; se descartó una opción interna que detenía la consulta. Ningún fallo pendiente se reclasificó como prueba correcta.

## Capturas revisadas

- [Personas, escritorio](fase-2-personas-1440.png).
- [Personas, reflujo](fase-2-personas-683.png).
- [Personas, móvil](fase-2-personas-390.png).
- [Personas, oscuro](fase-2-personas-oscuro.png).
- [Login, escritorio](fase-2-login-1440.png).
- [Login, móvil](fase-2-login-390.png).

Comprobación final adicional de la compilación de revisión en `3100`: instalación inicial disponible, sin cuentas QA, sin errores de consola/página ni infracciones axe detectadas en ese estado. [Captura del alta inicial](fase-2-instalacion-revision.png).

## Límites

No se probó un PostgreSQL gestionado, varios procesos sobre PGlite, recuperación por correo, antivirus, cifrado gestionado, puntos de control externos, retención operativa, carga de producción, pruebas externas de seguridad ni RPO/RTO. No hay autorización para conectar integraciones reales o publicar. El stack conserva ESLint 9.39.5 por los peers del conjunto Next ya documentados.

Las pruebas de datos usan información sintética. Personas/documentos/configuración son persistentes; los actos, identificaciones y caja del prototipo continúan en memoria. Las funcionalidades financieras nuevas procedentes de la comparación comercial siguen planificadas para las fases 3–4.

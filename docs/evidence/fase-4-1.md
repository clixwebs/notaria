# Evidencia ejecutada · Fase 4.1

29/10/2026 · America/Lima · NotariaOS 0.4.1. Datos ficticios independientes; no son datos de la notaría. Alcance: tarifario BK-18/33 y regresión de fundamentos, expedientes y finanzas. [Entrega](../phase-4-1/ENTREGA.md), [ADR 0005](../adr/0005-tarifario-versionado.md).

## Entorno y comandos

Windows, Node 24.20.0, Next 16.4.3, React 19.3.1, TypeScript 5.9.3, Better Auth 1.7.14, Kysely 0.29.7, PGlite 0.5.13, Zod 4.6.7 y Playwright 1.64.1/Chrome instalados, comprobados con `npm ls --depth=0`. Sin dependencias nuevas. La carpeta no tiene repositorio Git; [manifiesto SHA-256](fase-4-1-fuentes.json) identifica fuentes y pruebas verificadas.

- `npm run build`: correcto en compilación final; incluye comprobación TypeScript.
- `npm run typecheck` y `npm run lint`: correctos.
- `npm test`: **21 correctas**, 0 fallos.
- `npm run test:e2e`: **37 correctas**, 0 fallos/omitidas/reintentos, 91 805.956 ms. Configuración `playwright.phase41.config.ts`, suite `phase41.spec.ts`, regresión reutilizada de fases 3–4 y siete escenarios nuevos de `phase41.scenarios.ts`. [Resultado JSON](fase-4-1-e2e.json).
- `npx tsx scripts/verify-phase41-integrity.ts .notaria-phase41-qa-04`: siete grupos correctos. [Informe](fase-4-1-integridad.json).
- `npx tsx scripts/verify-phase4-integrity.ts .notaria-phase41-qa-04`: doce grupos financieros correctos. Se amplió únicamente la aceptación de nombres QA y la salida separada para 4.1. [Informe](fase-4-1-finanzas-integridad.json).
- `npm run backup:local -- .notaria-phase41-qa-04`: copia `backups/local-2026-10-29T08-56-53-254Z`, QA detenida.
- `npm run restore:local -- backups/local-2026-10-29T08-56-53-254Z .notaria-phase41-restaurada-qa-04`: restauración nueva sin sobrescribir. Ambos verificadores anteriores ejecutados también sobre la restaurada, correctos.
- `npx tsx scripts/compare-phase41-restoration.ts .notaria-phase41-qa-04 .notaria-phase41-restaurada-qa-04`: compara secuencialmente filas completas de quince tablas comerciales/financieras. [Comparación](fase-4-1-restauracion.json).
- `npx tsx scripts/check-review-phase41.ts`: acceso 200, tres APIs anónimas 401, ruta de tarifario redirige a acceso, sin errores de página. [Revisión local](fase-4-1-revision-local.json).

## Qué se comprobó

Rechazos por sesión, segundo factor, origen y perfil; publicación solo por Administración; catálogo inicialmente vacío; código único; importe positivo exacto. Publicaciones concurrentes con UUID idéntico dan un único efecto; solicitudes con revisión obsoleta o huella distinta se rechazan. Cantidades, precios y total conservan exactitud decimal.

Selección de tarifa validada por servidor: precio, descripción y clasificación alterados se rechazan; tarifa histórica sustituida, desactivada o de otro acto no se admite en una propuesta nueva. La propuesta aceptada y la orden permanecen iguales al publicar/desactivar. Cargo explícito de una propuesta histórica aceptada conserva **0.30** propios sobre **20.31** totales; **20.01** de terceros no se convierte en deuda ni ingreso. Anticipos/custodia/efectivo no cambian por ese cargo.

UI crea/publica, mantiene texto ante conflicto, selecciona tarifa y cantidad, muestra procedencia y convierte una línea en manual al cambiar su precio. Recargar conserva datos. Historial incluye las tres versiones de una tarifa probada. La regresión vuelve a recorrer permisos, archivos privados, versiones, presupuestos, cobros parciales, anticipos, gastos, fondos, reversos, cierres y conciliación.

Cuatro tablas de tarifa rechazan UPDATE y DELETE. Aislamiento por oficina. Fallo deliberado de auditoría revierte publicación, identidad del concepto, versión, revisión y solicitud; también presupuesto, vínculo y revisión de expediente. Las instantáneas coinciden con la versión inmutable. Restauración conserva conteos, líneas y precios exactos. La regresión de integridad financiera conserva sus doce controles de fase 4.

QA final: 5 conceptos, 7 publicaciones/solicitudes de tarifa, 3 vínculos de líneas a tarifa, 13 expedientes, 8 presupuestos, 5 aceptaciones y 29 entradas financieras. Saldos ficticios reconstruidos: deuda **80.51**, anticipos **5.20**, terceros **100.00**, efectivo **100.00**. Son cuatro magnitudes separadas.

## Interfaz y accesibilidad

ELDIAL/Clix, Montserrat, negro/azul y navegación superior conservados. Capturas de tarifario: [1440 px](fase-4-1-tarifario-1440.png), [683 px](fase-4-1-tarifario-683.png), [390 px](fase-4-1-tarifario-390.png), [diálogo oscuro](fase-4-1-tarifario-oscuro.png). Capturas generadas y revisión visual local de móvil/diálogo. Axe sin violaciones en página de tarifas en tres anchos y diálogo oscuro, ni en las vistas cubiertas por la regresión. Sin reflujo horizontal del documento en esos anchos; tabla con región desplazable. Escape cierra el diálogo y restaura foco al botón que lo abrió. No equivale a conformidad WCAG completa.

## Incidencias resueltas y límites

El sandbox de Windows no podía crear enlaces de Turbopack ni acceder a localhost/Chrome y ocultaba procesos del host. Compilación, servidor y E2E se ejecutaron finalmente en Windows con el permiso apropiado. Se identificó y detuvo el servidor principal real antes de la copia válida previa a migración (`backups/local-2026-10-29T08-47-33-352Z`). La copia inicial, obtenida tras una inspección de procesos restringida incompleta, no sustenta evidencia de respaldo cerrado.

Una primera validación unitaria detectó que un refinamiento decimal podía lanzar excepción ante formato inválido; corregido y probado. Ejecución QA-02: 34 escenarios correctos y un localizador de selector demasiado estricto; corregida la prueba. QA-03: 35 correctos y pérdida de foco al desmontar el diálogo compartido; corregido `ControlledModal` para cerrar/restaurar foco. QA-04: 37 correctos. No se relajaron controles de autenticación; la suite espera la ventana real de 60 segundos ante 429.

QA y restaurada están detenidas. Revisión principal activa en 127.0.0.1:3100, con base `.notaria/`, sin alta QA. No se consultaron secretos ni BD de clientes en las referencias, ni se modificaron esos proyectos. No se publicaron sitios ni conectaron proveedores.

Tarifario comercial inmediato y PEN. Catálogo e historial completos para este entorno local; evaluar volumen/paginación antes del piloto. Sin tratamiento tributario aprobado, XML/QR fiscal, adaptador simulado o emisión SUNAT. Procedimiento instrumental BK-14–17 pendiente. Sin PostgreSQL externo, antivirus/cifrado gestionados, prueba de carga, RPO/RTO operativo o habilitación del piloto.

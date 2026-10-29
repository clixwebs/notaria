# Evidencia · Fase 3 integrada · BK-15 a BK-17

29/10/2026 · NotariaOS 0.5.0 · Windows, Next 16.4.3, PGlite, Chrome, una notaría. ELDIAL negro/azul y Montserrat conservados. [Entrega](../phase-3/ENTREGA.md), [ADR0008](../adr/0008-procedimiento-instrumental-local.md).

André confirmó completar BK-15–17 juntos y retomar fases enteras. Se cierra el bloque **local** del procedimiento de fase 3, sin otra subfase decimal. La habilitación operativa, validación jurídica, identidad/firma/proveedores reales siguen pendientes. SUNAT real continúa deshabilitado. No se accedió a App prueba ni se publicaron servicios externos.

## Resultado ejecutado

| Comprobación | Resultado |
| --- | --- |
| `npm test` | 41 unitarias correctas, 0 fallos |
| `npm run build`, `npm run typecheck`, `npm run lint` | Correctos en compilación final |
| Regresión integrada en QA-03 | 54 escenarios anteriores correctos; 8 nuevos correctos antes del ajuste final de accesibilidad |
| `npm run test:procedure` final en QA-05 nueva | 10 correctos, 0 fallos/omitidos/reintentos, 12.940 s: los 9 escenarios del bloque y revocación de sesión |
| Integridad original y restaurada | 14 grupos correctos en cada base |
| Copia/restauración CLI | 41 tablas iguales por conteo y huella de todas las filas, incluidos bytes de documentos privados; clave local igual sin exponerla |
| Accesibilidad acotada | Axe sin violaciones en las pantallas cubiertas 1440/683/390 y diálogo oscuro; reflujo sin desborde global; Escape y retorno de foco |
| Revisión principal | Acceso 200, APIs sensibles 401 anónimas, redirección a acceso y sin errores de página; sin altas QA |

La suite completa de QA-03 registró **62 correctos, 1 fallo de accesibilidad y 1 omitido** antes de la corrección final. No se presenta ese JSON como una ejecución completa verde. El fallo era `scrollable-region-focusable` en la constancia: se agregó región enfocable por teclado. Los nueve recorridos del procedimiento se repitieron completos con ese arreglo en QA-04 y, tras presentar la constancia/historial como texto legible, otra vez en QA-05; ambos pases enfocados dieron 10 correctos, incluyendo cierre de sesión. Así se verifican 54 regresiones anteriores más los 10 escenarios finales, sin repetir regresiones ajenas por un cambio de presentación. La suite integrada queda disponible con `npm run test:e2e` para la siguiente entrega.

Se conservaron los intentos iniciales: QA-01 detectó normalización de fechas al congelar eventos (la huella rechazó la lectura); QA-02 detectó selector sin sustentos porque el listado general no incluía ID de persona. Se corrigieron normalización a texto y consulta autorizada de versiones liberadas del expediente, sin depender del límite global de 200 documentos. No se relajaron permisos, auditoría ni límites de autenticación para pasar pruebas. Las esperas de 61 segundos en la regresión respetan la ventana real de 429.

## Qué prueban los recorridos

Permisos y TOTP; exclusión de Caja y de participante ajeno; origen y contrato estricto; desconocido distinto de no coincidencia/error; consulta antes de reintento/excepción; excepción solo Notario con sustento individual liberado; comparecencia exacta; bloqueo por faltantes; número/folios transaccionales; doble clic idempotente; conflicto concurrente; dos expedientes del mismo registro sin duplicación; incidencia sin reutilizar número; nuevo documento sin reescribir instrumento anterior; certificación distinta de escritura; carta con varios intentos, aclaración append-only, constancia del Notario y entrega separada; descarga privada auditada; ausencia de cambios financieros/fiscales; recorrido completo de certificación por interfaz entre Administración y Notario; conservación de formulario y recuperación explícita del contexto.

Integridad: huellas, dos historias append-only, secuencias/rangos sin solapamiento, índice único contra número duplicado, detección de alteración, borrador congelado y su huella, vínculos de comparecencias del mismo caso, aislamiento por oficina y rol, reinicio/restauración, fallo de auditoría que revierte contador/evento/revisión/solicitud, reintento confirmado tras reinicio con un efecto, sin efectos en caja/fiscal/tarifas/plantillas/borradores, y base en disco intacta frente a pruebas en copia en memoria. La prueba de alteración deshabilita el trigger solo en la copia desechable; no se hace sobre disco/principal.

## Entornos y restauración

- Principal: `.notaria/`, respaldo cerrado previo `backups/local-2026-10-29T12-09-46-193Z`. Se identificó y detuvo el proceso Windows 23128 antes de abrirla. Servicio final `http://127.0.0.1:3100/expedientes`, sesión de herramienta 59943, migración 009 aditiva. No se crearon usuarios ni casos QA allí.
- QA integrada: `.notaria-procedure-qa-03`, detenida. Conserva 34 eventos/solicitudes del procedimiento, 3 contadores, 29 expedientes/participaciones, 14 borradores y 10 revisiones. Finanzas de regresión: 38 entradas, 47 solicitudes, 3 sesiones y 2 cierres. Fiscal simulado: 9 documentos/24 eventos. El verificador fiscal histórico que agrega un fixture adicional no se reejecutó en este bloque.
- Copia CLI integrada: `backups/local-2026-10-29T12-32-04-044Z`; restaurada nueva `.notaria-procedure-restaurada-qa-03`, detenida. Comparación secuencial de 41 tablas; auditoría excluida porque los verificadores registran lecturas. Compara archivos y clave sin imprimir contenidos/credenciales.
- QA enfocada final: `.notaria-procedure-qa-05`, detenida. QA-01, QA-02 y QA-04 también detenidas. Todas nuevas y separadas de la principal. Nunca dos procesos sobre la misma carpeta PGlite; comprobación real de Windows antes de cada apertura cerrada.

Comandos de restauración: `npx tsx scripts/verify-procedure-integrity.ts .notaria-procedure-qa-03`; `npx tsx scripts/backup-local.ts .notaria-procedure-qa-03`; `npx tsx scripts/restore-local.ts backups/local-2026-10-29T12-32-04-044Z .notaria-procedure-restaurada-qa-03`; verificador sobre restaurada; `npx tsx scripts/compare-procedure-restoration.ts .notaria-procedure-qa-03 .notaria-procedure-restaurada-qa-03`. Ejecutados con sus servidores detenidos.

## Artefactos y límites

[Resumen verificable](validacion-fase-3-procedimiento.json), [regresión conservada](fase-3-procedimiento-regresion.json), [pase enfocado final](fase-3-procedimiento-enfocada.json), [integridad](fase-3-procedimiento-integridad.json), [integridad restaurada](fase-3-procedimiento-integridad-restaurada.json), [restauración](fase-3-procedimiento-restauracion.json), [servicio principal](fase-3-procedimiento-revision-local.json), [fuentes SHA-256](fase-3-procedimiento-fuentes.json). Capturas: [1440](fase-3-procedimiento-1440.png), [683](fase-3-procedimiento-683.png), [390](fase-3-procedimiento-390.png), [oscuro](fase-3-procedimiento-oscuro.png), inspeccionadas en escritorio y móvil oscuro.

Manifiesto final:114 fuentes con SHA-256 y228 enlaces Markdown locales comprobados,0 rotos.

Solo textos y personas sintéticas. La prueba técnica no valida admisibilidad de excepciones, capacidad/poderes, contenido jurídico, formato legal de salida, protocolo/folios oficiales, firma, habilitación del profesional ni diligencia física. Sin DOCX/PDF, biometría, lector, RENIEC, SUNARP o emisión SUNAT. Política conservadora versionada; revisión con la notaría antes del piloto. Axe acotado no acredita conformidad WCAG completa. Siguiente bloque original: fase 5, cumplimiento; integraciones reales en fase 6 bajo autorización.

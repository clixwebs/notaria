# BK-14 · Plantillas jurídicas · NotariaOS 0.4.3

29/10/2026 · implementación local. Conserva el núcleo 0.4.2, familia ELDIAL/Clix, Montserrat, negro/azul, barra superior, móvil y modo oscuro.

## Uso

1. Abogado o Notario, con TOTP verificado y sesión reciente, abre **Más → Plantillas jurídicas** (`/plantillas`). El catálogo empieza vacío.
2. En **Nueva plantilla**, indica código estable, título, acto y texto plano. Inserta `{{clave}}` y define cada variable con su etiqueta/tipo. Revisa el contenido, registra motivo y confirma la revisión del texto base para publicar.
3. Tipos: texto, fecha, importe PEN, entero e interviniente. Todos son requeridos. También están disponibles `{{expediente.referencia}}`, `{{expediente.acto}}`, `{{expediente.asunto}}`. No hay cálculos, condiciones ni sustitución automática de comparecientes.
4. En **Expediente → Documento → Usar plantilla jurídica**, Administración, Recepción, Abogado o Notario elige una versión vigente del mismo acto y completa los valores. El interviniente se selecciona dentro del expediente y usa su instantánea conservada.
5. **Vista previa del borrador** valida y resuelve los valores en servidor. **Guardar borrador generado** agrega una versión con plantilla, valores, contexto y SHA-256. La vista previa debe repetirse si cambian datos o contexto. Si hay conflicto, actualiza las plantillas o el contexto dentro del diálogo, conserva los valores y revisa nuevamente.
6. El panel **Origen** permite consultar texto base, versión, variables resueltas y huella de la publicación. El selector de borradores conserva versiones anteriores. **Registrar revisión profesional** sigue siendo una acción separada, exacta para documento/contexto, disponible solo a Abogado/Notario.
7. **Nueva versión** permite corregir, retirar o reactivar una plantilla. Si otra persona publica mientras editas, debes actualizar y adoptar explícitamente la nueva versión base antes de publicar tu texto conservado. El historial permite consultar cualquier versión; no puede usarse una versión antigua/retirada en una nueva generación.

La redacción manual existente continúa disponible y conserva su comportamiento. Una edición manual se identifica como tal; no hereda automáticamente la revisión ni el vínculo de generación de la versión copiada.

## Implementación

Migración 008; catálogo, publicaciones, solicitudes y vínculos de origen inmutables. Generación atómica sobre los borradores existentes, con revisión, UUID/huella/actor/oficina y auditoría. API protegida `/api/templates`, `/preview`, `/generate`. Ninguna operación toca cargos, pagos, anticipos, fondos de terceros o documentos fiscales.

Código: `src/lib/template-domain.ts`, `src/server/templates.ts`, `template-schema.ts`, `src/components/template-pages.tsx`, integración en el documento del expediente y navegación existente. No hay nuevas dependencias ni semillas jurídicas. [ADR 0007](../adr/0007-plantillas-juridicas-versionadas.md).

## Validación

Comandos: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`. Configuración vigente `playwright.phase43.config.ts`, `phase43.spec.ts` y `phase43.scenarios.ts`; regresión reutilizada de fases anteriores. Crear siempre una base `.notaria-phase43-qa-*` nueva, con URL 3101 y sin DATABASE_URL externo. Respetar rate limit real; puede esperar una ventana de sesenta segundos.

Tras detener y comprobar el propietario Windows del servidor QA: verificadores 43/42/41/4, copia CLI, restauración a una carpeta nueva y comparación secuencial. Los verificadores solo aceptan nombres QA dentro del proyecto. No abrir nunca un directorio PGlite desde dos procesos.

Resultados y bases finales se registran en [evidencia BK-14](../evidence/fase-4-3.md) y [resumen JSON](../evidence/validacion-fase-4-3.json). Las capturas no contienen datos reales.

## Pendiente antes de operación

Textos y política de aprobación de la notaría, revisión jurídica de contenido y requisitos para cada acto. Este motor prepara borradores planos sin firma ni validez notarial; no ofrece una biblioteca de cláusulas aprobadas. DOCX/PDF/formato enriquecido y condiciones/repeticiones requieren alcance posterior.

BK-15–17, integraciones reales, controles operativos y piloto permanecen pendientes. La emisión real SUNAT sigue deshabilitada; el laboratorio fiscal conserva su simulación fija, sin proveedor ni red.

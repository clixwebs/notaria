# ADR 0007 · Plantillas jurídicas versionadas y generación de borradores

29/10/2026 · aceptada para el corte local BK-14 / versión 0.4.3. La numeración 4.3 identifica la continuación de la entrega local; no cambia el orden ni da por terminadas las fases del plan maestro.

## Problema y decisión

Los borradores persistentes de fase 3 conservaban texto y contexto, pero carecían de un origen reutilizable con variables tipadas. Se añade un catálogo por oficina, inicialmente vacío, de plantillas en texto plano. No se inventan cláusulas ni se precargan modelos jurídicos. La notaría debe aportar y revisar sus propios textos antes de utilizarlos operativamente.

Abogado y Notario publican versiones mediante confirmación expresa de revisión del texto base, con motivo, TOTP y sesión reciente de quince minutos. Administración y Recepción pueden consultar y generar borradores; no publican ni adquieren revisión profesional. Caja queda excluida. No se exige un segundo aprobador distinto del autor en este corte; esa política puede añadirse si la notaría la requiere. Publicar una plantilla no revisa automáticamente ningún documento generado.

Cada publicación conserva código estable, título, acto, texto, definición de variables, disponibilidad, motivo, autor y SHA-256 canónico. Retirar o reactivar publica otra versión. Un cambio de acto tampoco reescribe el historial. Solo la última versión disponible y correspondiente al acto se admite para nuevas generaciones. Los reintentos ya confirmados recuperan su resultado original aunque después se retire la plantilla.

## Contrato de texto y variables

Motor `plain-v1`: sustitución literal en una sola pasada de `{{clave}}`. Sin evaluación de expresiones, HTML ejecutable, acceso al sistema de archivos, importación de macros, condiciones, repetidores, IA o recursos remotos. Texto y valores se presentan mediante React como contenido plano.

Variables explícitas y obligatorias: texto, fecha civil ISO, importe PEN, entero no negativo e interviniente del expediente. Máximo treinta; claves únicas, usadas en el texto y con etiquetas. Se rechazan marcadores mal formados, desconocidos, valores faltantes/sobrantes y expansión recursiva. Fechas se presentan DD/MM/AAAA; importes se normalizan a dos decimales con cadenas/BigInt, sin alterar obligaciones ni fijar un tratamiento fiscal. Enteros de hasta nueve dígitos; texto manual hasta dos mil caracteres. Texto base 20–30000 caracteres; resultado 20–40000.

Campos reservados: `expediente.referencia`, `expediente.acto`, `expediente.asunto`. No se infiere una fecha, firmante, calidad jurídica o primer compareciente. Un campo interviniente exige seleccionar su UUID dentro del expediente; se resuelve con su instantánea histórica de nombre, tipo/número de documento y calidad registrada. No usa la ficha general modificada posteriormente ni afirma identidad o capacidad verificadas.

La vista previa se construye en servidor con el mismo motor y contexto de la generación. No crea versiones. Cambiar valores, selección o revisión del expediente invalida la vista previa en pantalla. El formulario puede actualizar el contexto sin perder valores. La generación siempre vuelve a validar la versión y el contexto en servidor.

## Persistencia, concurrencia y auditoría

Migración 008 aditiva. `legal_templates`, `legal_template_versions`, `template_requests` y `case_draft_templates` rechazan UPDATE/DELETE mediante el mecanismo append-only existente. `template_state` conserva la revisión reconstruible del catálogo.

Publicación toma bloqueo exclusivo del estado por oficina. Generación toma primero bloqueo exclusivo del expediente y luego compartido del catálogo; publicación no toma expedientes. Se valida revisión del expediente, última versión del borrador, oficina, acto y versión activa hasta confirmar la transacción. La vista previa usa bloqueos compartidos y no retiene bloqueos después de responder.

El borrador se agrega a `case_drafts` y conserva texto, contexto y huella existentes, más `templateSource`: UUID/código/versión/título/acto, texto y variables de la plantilla, huella de publicación, valores normalizados y sustituciones resueltas. La relación inmutable conserva también la versión de origen. El nuevo borrador incrementa revisiones de expediente/contenido y exige nueva revisión profesional. Las revisiones anteriores siguen vinculadas a su documento y contexto exactos.

UUID de solicitud, hash canónico, tipo de operación, actor y oficina delimitan los reintentos. Solicitudes iguales recuperan resultado; reutilizar clave con otro actor/contenido produce conflicto. Una generación concurrente diferente no sobrescribe otra. Publicación, documento/vínculo, revisión, actividad, solicitud y auditoría se confirman juntos; un fallo de auditoría revierte los cambios. La auditoría guarda referencias, no los valores jurídicos en texto abierto del evento.

La edición manual posterior sigue creando una versión manual independiente, rotulada sin vínculo de generación. La versión generada original y su procedencia no cambian. No se afirma que una versión manual conserve automáticamente la estructura o la revisión de la plantilla.

## Límites y dependencias

No genera instrumentos autorizados, numeración instrumental, firmas, otorgamientos, traslados o constancias de entrega. No incluye DOCX/PDF, importación de modelos, editor de formato enriquecido, cláusulas condicionales ni validación semántica de textos jurídicos. Volumen/paginación del catálogo y política de aprobación organizativa deben validarse antes del piloto.

BK-15–17 conservan sus cortes de identificación/contingencias, otorgamientos/numeración y diligencia/entrega. BK-26 real continúa deshabilitado: ninguna URL, certificado, proveedor o modo de emisión se añade. Dinero, anticipos y fondos de terceros permanecen en el dominio financiero existente.

Fuentes técnicas: [esquemas estrictos y refinamientos de Zod](https://zod.dev/api), [bloqueos de filas de PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html). Se conservan las versiones fijadas en package-lock; no se añadió una dependencia. Son fundamentos técnicos, no validación jurídica de los textos.

Validación y límites observados: [entrega](../phase-4-3/ENTREGA.md) y [evidencia](../evidence/fase-4-3.md).

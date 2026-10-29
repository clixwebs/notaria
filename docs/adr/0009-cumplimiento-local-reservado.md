# ADR 0009 · Cumplimiento local reservado

Fecha: 29/10/2026. Estado: implementado para revisión local en 0.6.0. Decisión técnica; no certifica cumplimiento jurídico ni habilita operación. André autorizó **fase 5 completa, BK-21 a BK-23 juntos**, sin subfases.

## Problema y alcance

El procedimiento y el núcleo económico ya persisten. Faltaban reserva PLAFT, diligencia/riesgo con revisión humana, finalidades/avisos/consentimiento, solicitudes ARCO, incidentes, conservación y exportaciones con trazabilidad. Los formatos, supuestos y responsables operativos de la notaría no están homologados. El plan exige mantener deshabilitados los formatos pendientes.

Se entrega un único módulo local `/cumplimiento/plaft` y `/cumplimiento/privacidad`, API `/api/compliance`, migración 010 aditiva. No contiene semillas, clientes o políticas preaprobadas. No modifica dinero, saldos, anticipos, terceros, tarifas, borradores o actuaciones. SUNAT real permanece deshabilitado.

## Reserva y perfiles

- `compliance:plaft`: solo perfil Notario, como custodio de ejercicio local. Administración, Recepción, Abogado y Caja carecen de lectura, recuentos, historial y descargas. No se infiere designación OCP/oficial de cumplimiento por tener ese perfil.
- `compliance:privacy`: Administración y Notario. Publicar política/finalidad y levantar un bloqueo exige Notario; Administración captura avisos, solicitudes, incidentes y bloqueos sin adquirir potestad de levantarlos.
- API verifica sesión, TOTP y oficina; mutaciones además origen y sesión reciente de 15 minutos. Permisos se verifican en servidor y las denegaciones por permiso quedan auditadas. Cambios de rol/habilitación revocan sesiones mediante el mecanismo existente.
- Información PLAFT permanece en tablas propias; nunca en actividad del expediente, títulos de documentos generales, búsqueda global o contenido de auditoría general. Auditoría general solo acción/área, sin señal, persona o UUID de registro reservado. Consultas y descargas autorizadas también se auditan, atómicamente.
- Es segregación de aplicación según perfil vigente. No protege contra un operador de BD o quien controle infraestructura/credenciales y provisión de perfiles profesionales; revisión de administración privilegiada y designaciones reales pendientes antes del piloto. No añadir delegaciones administrativas implícitas.

## Historia e integridad

`compliance_records`, `compliance_events`, `compliance_requests`, `compliance_artifacts` son append-only, con triggers que rechazan UPDATE/DELETE. `compliance_state` es revisión reconstruible por oficina y área: privacidad no revela la revisión PLAFT.

Cada evento conserva actor/tiempo/secuencia y SHA-256 canónico de registro/secuencia/tipo/datos/huella anterior. Lecturas y exportaciones comprueban la cadena. La huella no es firma ni anclaje independiente. Artefactos guardan contenido y hash y se validan al descargar. Los sustentos son textos reservados capturados y referencias externas declaradas; no se cargan adjuntos reservados al archivo documental general ni se finge verificar sus originales.

Toda mutación bloquea primero la fila oficina/área. UUID/huella/actor/oficina asegura reintento de respuesta confirmada antes de comprobar revisión. UUID con datos/actor distintos rechaza. Registro/evento/artefacto/revisión/solicitud/auditoría se confirman en una misma transacción; fallo de auditoría revierte todo. Esta rama no toma locks de expediente o finanzas ni escribe esos módulos; conserva instantáneas de la consulta transaccional, sin afirmar inmovilización o autorización jurídica.

## BK-21 · Diligencia y riesgo

Registro explícito de expediente y persona participante, fecha de operación, importe decimal exacto PEN, PEP declarado (sí/no/pendiente), beneficiario final y diligencia, origen de fondos, señales, nivel y próxima revisión. Importe no proviene de saldos ni crea movimiento. BigInt/cadenas, nunca Float para dinero.

Se conserva instantánea de referencia/acto/contexto e intervención, bajo política de ejercicio `plaft-local-v1`. Riesgo no se determina automáticamente: revisión humana agrega decisión seguimiento/cerrado/escalar, nivel, fundamento y próxima revisión. Escalar no crea ni envía ROS. No hay consulta a listas, inferencia de PEP o valoración jurídica automática.

## BK-22 · Privacidad

Finalidad por código, con publicaciones consecutivas, base/supuesto, texto del aviso, necesidad de consentimiento, fuente/aplicabilidad, días hasta revisión de conservación, calendario ARCO y feriados. Notario confirma evaluación local expresamente. No hay política activa implícita ni aviso aprobado precargado. Nueva captura exige última versión publicada; tratamientos y solicitudes existentes conservan su política anterior.

Aviso comunicado y evidencia por persona/versión; consentimiento cuando la política lo exige. Retiro agrega evento para esa finalidad exacta, sin destruir instrumentos, otros fundamentos o historia. La revisión de conservación se agenda desde el registro local del tratamiento; no presume el dies a quo ni plazo legal aplicable a todos los documentos.

ARCO admite información/acceso/rectificación/cancelación/oposición, recepción, alcance y política exacta. Calcula desde el día siguiente con calendario/feriados explícitos. Los valores orientativos del formulario (8/20/10) necesitan publicación consciente con fuente; no se publica ninguna política automáticamente. No pretende resolver subsanaciones, suspensiones o cómputos normativos complejos no configurados: su determinación operativa requiere procedimiento aprobado. Verificación de identidad/representación y evidencia obligatorias antes de respuesta entregada. Ampliación única, excepto información, comunicada dentro del plazo original, por igual número de días bajo el calendario congelado. Respuestas tardías se registran con su fecha real; no se altera recepción ni plazo para ocultarlas.

Conservación por persona, categoría y expediente opcional. Bloqueo activo aunque pase su fecha de revisión, hasta levantamiento motivado por Notario. Un bloqueo impide marcar como totalmente atendida una cancelación; permite respuesta parcial/denegatoria fundada. Toda respuesta solo registra comunicación y decisión: no se implementa borrado de fichas, bytes privados, auditoría o instrumentos. El plazo vencido o consentimiento retirado tampoco ejecuta supresión automática.

Incidente conserva conocimiento original, descripción y medidas. ANPD, titular y CNSD requieren evaluaciones separadas aplica/no-aplica/pendiente con fundamento. Hito inicial de ANPD/CNSD igual al conocimiento registrado; para titular admite hito posterior evaluado. Primera evaluación fija hito de cada destinatario: posteriores no reinician reloj. Cuando aplica muestra 48 horas transcurridas desde ese hito como política orientativa de revisión, no desde creación del ticket. No aplica conserva fundamento sin vencimiento ficticio. Las obligaciones y supuestos concretos deben revisarse: el plazo de 48 horas no convierte todas las notificaciones al titular en un régimen universal.

Constancia externa por destinatario con fecha/referencia/sustento. No se notifica desde el ERP. Cierre exige evaluación definida de los tres destinatarios y constancia correspondiente a la última evaluación aplicable. Cierre no elimina historia ni convierte declaración en recepción verificada.

## BK-23 · Exportación de revisión

Contrato **`notariaos-ro-review-v1`**, JSON canónico interno de revisión, no estructura oficial SBS/OCP. Selección explícita de operaciones únicas del periodo y con revisión humana. Congela origen, historial completo y última revisión, identificadores y huellas. Validación independiente del contrato, periodo, dinero, duplicados, secuencias/cadenas, origen y revisión. Cada nueva preparación crea UUID y artefacto nuevos; una revisión posterior no cambia el archivo anterior.

Descarga privada exclusiva de PLAFT, `no-store`, `nosniff`, `attachment`, con auditoría. Descargar no cambia estado de presentación. Cargo externo se declara explícitamente para UUID/huella exactos, con fecha/referencia/sustento, como **no verificado**. No se marca aceptado por SBS, OCP o SUNAT; no se automatiza ROS o envío regulatorio. No hay canal, URL, credenciales o toggle productivo.

**Formato oficial deshabilitado:** faltan anexos/estructura consolidada 2026, catálogos, calendario aplicable, responsabilidades notaría/OCP y homologación. La ficha SBS 01917-2026 confirma cambios; no se usan plazos del instructivo 2025 aislados. Este límite está exigido por la salida de fase 5 del plan y no se disfraza mediante una etiqueta de subfase.

## Interfaz y verificación

Componentes, Montserrat, login, navegación superior y negro/azul ELDIAL conservados. Formularios retienen valores tras conflicto y solo actualizan la revisión mediante acción explícita. UUID estable si el cuerpo no cambia. Tabla con región desplazable accesible, pestañas existentes, modal con Escape y retorno de foco, alertas y oscuro/móvil. Sin JSON interno como formulario o detalle del producto.

[Entrega](../phase-5/ENTREGA.md) y [evidencia ejecutada](../evidence/fase-5.md) distinguen resultados reales y límites. QA siempre nueva/separada; no dos procesos por PGlite. Respaldar principal cerrada antes de migrar; pruebas destructivas solo en copia QA en memoria.

## Fuentes consultadas el 29/10/2026

- [DS 016-2024-JUS, texto oficial Congreso](https://www3.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf): consulta puntual de incidentes y respuesta/ampliación ARCO, arts.34–36 y69–71; no revisión consolidada exhaustiva.
- [ANPD, ficha del reglamento](https://www.gob.pe/institucion/anpd/normas-legales/6554453-16-2024-jus).
- [SBS, buscador oficial UIF](https://www.sbs.gob.pe/app/pp/INT_CN/Paginas/Busqueda/BusquedaPortalUIF.aspx): ficha 01917-2026 y modificaciones del RO; texto/anexos finales sin homologación.
- [SBS, norma del sector notarial](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/3736): separación de funciones notario/OCP.
- [PostgreSQL17, bloqueos](https://www.postgresql.org/docs/17/explicit-locking.html), [Zod4, contratos discriminados](https://zod.dev/api#discriminated-unions): decisiones técnicas verificadas frente a dependencias instaladas.

Antes del uso real: responsables nominales, políticas/revisión jurídica, anexos oficiales y calendario, sustentos originales, provisión privilegiada y designaciones, seguridad/recuperación/retención operativa. La fase 6 requiere autorizaciones y convenios; esta entrega no conecta proveedores reales.

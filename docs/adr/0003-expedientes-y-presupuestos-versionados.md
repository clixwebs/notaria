# ADR 0003 — Expedientes y presupuestos versionados

29/10/2026 · Aplicado al corte solicitado de fase 3 · Una notaría.

## Decisión

Se sustituye el escenario en memoria de las rutas principales por expedientes relacionales persistentes. Se conserva la estructura visual ELDIAL/Clix, Montserrat, negro tinta y azul jurídico. No se añaden dependencias ni se modifican proyectos de referencia.

Las migraciones 003–004 agregan expediente, contador interno anual, intervinientes con instantánea, requisitos, borradores/revisiones, tareas, observaciones, presupuestos/aceptaciones, orden de servicio y actividad. Son aditivas sobre las migraciones 001–002. Antes de actualizar la instalación de revisión se creó una copia con el servidor detenido.

## Identidad y concurrencia

El expediente se identifica por UUID; su kardex visible usa año de Lima y contador transaccional, con restricciones únicas. No se calcula `MAX + 1`. **Es una referencia administrativa interna; no constituye numeración de escritura, folio ni instrumento.**

La creación recibe una clave UUID y una huella de su contenido validado. Repetir la misma solicitud devuelve el mismo expediente; cambiar el contenido o actor bajo esa clave produce conflicto. Las mutaciones bloquean la fila del expediente y comparan su revisión esperada. Cada operación, actividad y auditoría se confirma en la misma transacción.

Una revisión de contexto separada cambia cuando se incorporan personas, modifican requisitos o guardan borradores. Así, un presupuesto o tarea nueva no invalida por sí solo la revisión documental. Cambiar la preparación sí exige una revisión nueva. El formulario conserva el texto ante un conflicto y permite actualizar el contexto sin cerrarlo.

## Historia y revisión documental

Cada incorporación conserva nombre, identificador, revisión de ficha y calidad de participación. Editar Personas no reescribe la instantánea. Cada borrador conserva texto plano, intervinientes, requisitos y versión de catálogo. Su SHA-256 se calcula sobre una representación JSON con claves ordenadas del contenido y contexto; se puede reconstruir después de almacenar JSONB.

Los borradores, revisiones, instantáneas, observaciones y actividad son registros añadidos, protegidos contra UPDATE/DELETE. Los requisitos actuales pueden actualizarse; cada revisión conserva resultado, observación, sustento, actor y fecha en un historial inmutable. El evento de cambio, el contexto y las versiones documentales previas permanecen. El catálogo inicial es orientativo y debe validarse por servicio antes de operar.

Los perfiles Abogado y Notario registran revisión de preparación sobre la última versión y contexto exactos, con sesión reciente. Administración y Recepción no reciben ese permiso. Esta revisión **no autoriza ni firma un instrumento**. El contenido se muestra como texto, sin ejecutar HTML ni scripts.

Los requisitos pueden vincular una versión privada liberada de un interviniente del mismo expediente/oficina. No se aceptan versiones en cuarentena o de personas ajenas. La descarga sigue aplicando los controles del archivo privado.

## Presupuesto y aceptación

Cada propuesta nueva inserta una versión inmutable con conceptos, clasificación comercial, cantidad, importe unitario, moneda PEN y vigencia. Se usan cadenas decimales en la API, cálculo exacto con enteros grandes en céntimos y PostgreSQL `numeric(14,2)` para el total. No se aceptan totales calculados por el cliente, exponentes, importes negativos ni fracciones adicionales.

Administración/Recepción registran la aceptación comunicada por un interviniente, con referencia del sustento, actor y fecha. Solo se acepta la última versión no vencida. La aceptación es única por versión e inmutable. No equivale a que el cliente se haya autenticado o firmado digitalmente.

Cada expediente tiene una orden de servicio administrativa estable. Aceptar otra versión actualiza su referencia de presupuesto, conservando todas las aceptaciones anteriores. Crear una propuesta nueva no cancela la orden ya aceptada. Nada de esto registra pagos, comprobantes, aplicaciones, saldos de fondos de terceros ni autorización notarial; esos movimientos corresponden a fases posteriores.

## Alcance pendiente

Este corte implementa lo pedido: expedientes, requisitos, versiones y presupuestos, además de tareas/observaciones. Plantillas con variables y generación de instrumentos, identificación/contingencias, otorgamientos, numeración instrumental, diligencia y entrega persistentes requieren el siguiente corte del procedimiento notarial. La referencia de kardex y la orden administrativa no sustituyen esas capacidades.

Continúan los límites de fase 2: PGlite local de un proceso, integraciones sin conectar y recuperación operativa/infraestructura pendientes. El adaptador PostgreSQL de servicio no se ha ensayado externamente.

## Fuentes técnicas

- [PostgreSQL: bloqueos de filas](https://www.postgresql.org/docs/current/explicit-locking.html).
- [PostgreSQL: tipos numéricos exactos](https://www.postgresql.org/docs/current/datatype-numeric.html).
- [Kysely: transacciones y rollback](https://kysely.dev/docs/examples/transactions/simple-transaction).
- [Next.js: autorización cerca de los datos](https://nextjs.org/docs/app/guides/authentication).

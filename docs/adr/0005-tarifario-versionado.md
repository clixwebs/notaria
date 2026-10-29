# ADR 0005 · Tarifario comercial versionado

Estado: implementado para revisión local, 29/10/2026 · NotariaOS 0.4.1. Continúa BK-18/33, después del núcleo financiero de fase 4. Una notaría, identidad ELDIAL/Clix existente.

## Decisión

Completar primero el tarifario administrable que condiciona el bloque fiscal. Migración 006 aditiva, sin tarifas predeterminadas: identidad de concepto por oficina y código estable, publicaciones inmutables con descripción, clasificación, acto opcional, importe unitario, disponibilidad, motivo y autor. La publicación tiene efecto inmediato. Desactivar o reactivar también crea versión; no hay borrado ni edición histórica ni calendario de tarifas futuras.

Administración publica con TOTP y sesión reciente de 15 minutos. Recepción, Caja, Abogado y Notario pueden consultar el catálogo; esto no concede permisos de presupuesto ni revisión profesional adicionales. El tarifario no contiene expedientes, archivos ni identidades de clientes. El permiso se comprueba en API y en el caso de uso de publicación.

Una fila `tariff_state` por oficina serializa publicaciones. Revisión optimista, versión base y solicitud UUID/huella canónica/actor/oficina previenen sobrescrituras y efectos repetidos. Versión, revisión, auditoría y respuesta idempotente se confirman en una transacción. Repetir la misma solicitud recupera el resultado aunque haya avanzado la revisión; otra carga o actor no puede reutilizarla.

Al presupuestar se elige una versión activa y vigente del concepto, aplicable al acto o a todos. El servidor vuelve a validar oficina, versión, disponibilidad, descripción, clasificación e importe. Toma un bloqueo compartido del estado del catálogo hasta confirmar la instantánea y el vínculo de cada línea. Una publicación concurrente espera o provoca que la selección anterior sea rechazada; no hay cambio silencioso de precio. La cantidad sigue siendo propia de la propuesta. Importes en cadenas y `numeric(11,2)` para precio unitario, aritmética BigInt y `numeric(14,2)` para total existente.

Cada línea guarda precio y texto, UUID de versión y procedencia código/versión generada por servidor. `case_quote_tariffs` agrega vínculo referencial inmutable al historial. Las propuestas anteriores a 006 permanecen intactas. Cambiar una tarifa no cambia propuestas, aceptaciones, órdenes o cargos anteriores. Una aceptación válida de una propuesta histórica sigue pudiendo trasladarse a cargo por sus importes originales.

Se conservan conceptos manuales para acuerdos comerciales. En la interfaz, cambiar texto, clasificación o precio quita explícitamente el vínculo de tarifa; la ayuda lo comunica. Cambiar la cantidad conserva el vínculo. Copiar una versión desactivada o sustituida exige volver a elegir tarifa vigente o elegir concepto manual. Esto evita presentar una edición libre como precio proveniente del catálogo.

## Límites y siguiente corte

PEN, disponibilidad inmediata y catálogo completo para revisión local; evaluar paginación/volumen antes del piloto. Sin descuentos automáticos, fórmulas, impuestos, vigencias programadas, XML, QR fiscal o envío a SUNAT. No interpretar `Honorarios`, `Otros` o `Terceros` como códigos tributarios. Terceros sigue excluido del cargo propio de presupuesto por la regla ya implementada en fase 4. Publicar una tarifa no genera deuda ni flujo de caja.

Siguiente corte económico: contrato fiscal XML/QR y adaptador simulado de BK-19, con estados y respuestas claramente de prueba. El contrato fiscal requiere revisar reglas tributarias y contrato de proveedor; el acceso real corresponde a BK-26 y autorización propia. Se mantienen pendientes los procedimientos instrumentales BK-14–17 y sus validaciones jurídicas antes de cumplimiento/piloto; este corte comercial no los sustituye.

## Fundamento consultado

- [Kysely: Transaction](https://kysely-org.github.io/kysely-apidoc/classes/Transaction.html), transacciones y propagación de errores.
- [PostgreSQL: bloqueos explícitos](https://www.postgresql.org/docs/17/explicit-locking.html), coordinación de lectores y publicaciones.

Versiones instaladas comprobadas mediante `npm ls --depth=0`, sin dependencias nuevas. Ver [entrega](../phase-4-1/ENTREGA.md) y [evidencia](../evidence/fase-4-1.md).

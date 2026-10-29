# Contrato fiscal de simulación v1

29/10/2026 · NotariaOS 0.4.2 · BK-19 local. Identificador: `notariaos-fiscal-sim-v1`. Implementado en `src/lib/fiscal-domain.ts`, `src/server/fiscal-xml.ts` y `src/server/fiscal-adapter.ts`.

## Alcance y frontera

Factura y boleta de **prueba** sobre un cargo propio de presupuesto aceptado, persistente y no revertido. El documento conserva su cargo, cliente por ID, expediente por ID y versión de presupuesto. No se obtiene desde anticipo, custodia, gasto o un cobro aislado. Los conceptos Terceros se excluyen antes de ofrecer el origen y de calcular importes.

Emisor fijo ficticio `00000000000`, razón `EMISOR FICTICIO NOTARIAOS`. Series internas `SIM-F001` y `SIM-B001`, separadas por oficina/tipo. No consume series autorizadas, no contiene certificado/firma y no consulta RUC/identidad. Todos los artefactos llevan `SIMULACIÓN · SIN VALIDEZ TRIBUTARIA · SIN ENVÍO A SUNAT`. El marcador SIM y el RUC ficticio impiden confundir estos archivos con un comprobante habilitado.

El XML es un subconjunto contractual inspirado en Invoice UBL 2.1; la lectura verifica XML bien formado, namespaces y datos. Además, los diez XML QA pasan el XSD Invoice UBL 2.1 de OASIS, con catorce esquemas públicos descargados y hashes registrados. **Esto no valida los catálogos/reglas SUNAT vigentes, tratamiento tributario de la notaría, firma o aceptación fiscal.** El contrato real y su homologación pertenecen a la habilitación posterior.

## Entrada y cálculo

| Campo | Regla local |
| --- | --- |
| `requestId`, `revision` | UUID de solicitud y revisión de la oficina; reintento idéntico devuelve resultado previo |
| `chargeId` | Cargo de presupuesto del ámbito de la sesión, vigente y sin documento activo |
| `documentType` | `01` factura de prueba / `03` boleta de prueba |
| `receiver` | Nombre explícito y documento tipo `1`, `4`, `6` o `7`; solo se valida formato local |
| Factura | Receptor con tipo `6`, 11 dígitos; no se verifica existencia ni condición del RUC |
| Boleta | Receptor identificado explícitamente; no hay boleta anónima en este corte |
| `taxes[]` | Un elemento por concepto propio, índice sobre la lista propia del cargo, sin duplicados |
| `tax` | Supuesto explícito `gravado18`, `exonerado` o `inafecto`; sin selección automática por categoría |
| `purpose` | `service` o `identity-query`; consulta de identidad se conserva en una línea separada |
| `scenario` | Escenario del simulador, congelado al preparar |
| `acknowledgeSimulation` | Debe ser `true` |

No se admiten total, precios, XML, modo productivo ni URL de proveedor aportados por el navegador. Los conceptos y el importe vienen del cargo/presupuesto inmutable. No se sustituye identidad de Personas al introducir receptor de prueba.

Política **del ejercicio**, sin configurar la fiscalidad real: los precios del presupuesto son finales incluidos impuestos. Para cada línea propia, bruto = precio unitario × cantidad. En gravado, base en céntimos = `floor((bruto × 100 + 59) / 118)`; impuesto = bruto − base. En exonerado/inafecto, base = bruto e impuesto = cero. Total/base/impuesto son suma de líneas. Se conserva exactamente el total del cargo, sin añadir impuestos a la deuda. Diferentes reglas de redondeo/tributación reales requieren otro contrato validado.

Ejemplo QA: honorarios `118.00` gravados → base `100.00`, impuesto `18.00`; consulta de identidad `0.10` inafecta de prueba → base `0.10`. Documento `118.10`. Los `30.00` previstos para terceros en la propuesta quedan fuera. Esto no determina si una consulta real de RENIEC está gravada, exonerada o constituye reembolso.

## XML y QR

El XML incluye namespaces Invoice/CommonAggregate/CommonBasic de UBL, `UBLVersionID=2.1`, `CustomizationID=2.0`, perfil `SIMULACION-NOTARIAOS`, extensión de simulación, emisor/receptor, fecha Lima, número SIM, líneas, categorías de impuesto y totales PEN. Usa códigos de ejercicio `10/1000`, `20/9997` y `30/9998`; los escenarios se eligen de forma expresa. Precio neto unitario con diez decimales, base e impuesto por línea con dos. Los caracteres XML se escapan y los controles ilegales se rechazan; no se ingiere XML externo ni DTD. No hay `SignatureValue` ni `DigestValue` ficticios.

La estructura QR adapta los campos de identificación de la referencia ELDIAL, pero añade un envoltorio inequívoco:

```text
NOTARIAOS:SIMULACION:v1|RUC_FICTICIO|TIPO|SERIE_SIM|NUMERO_8_DIGITOS|IGV_EJERCICIO|TOTAL|FECHA_LIMA|TIPO_DOC_RECEPTOR|DOC_RECEPTOR|SHA256:HUELLA_XML|SIN-FIRMA|
```

Es una imagen QR PNG generada localmente, decodificada con un lector independiente en pruebas. El SHA-256 es integridad local del XML, no valor resumen de una firma electrónica ni validación SUNAT. XML/PNG/cadena QR, instantánea y hashes se congelan al preparar. Las descargas vuelven a comprobar integridad, permiso/ámbito y auditoría; nunca son enlaces públicos.

## Adaptador y estados

Contrato `FiscalAdapter`: modo fijo `simulation`, métodos `submit` y `consult`. Entrada: clave estable UUID del documento, SHA-256 del XML, escenario, número de intento y recibo durable del simulador. Respuesta: clave, huella y observación normalizada; recibo opcional al registrar. La clave/huella deben coincidir. Respuesta inválida, ajena o excepción produce **resultado desconocido**, sin afirmar aceptación. Los códigos llevan `SIM-`; no se interpretan como códigos oficiales ni CDR.

| Escenario | Primera simulación de envío | Consulta / reintento |
| --- | --- | --- |
| `accept` | Aceptado por simulador y recibo durable | Estado terminal; reintento idéntico solo recupera la respuesta anterior |
| `reject` | Rechazado por simulador | Administración puede descartar y preparar otro número interno |
| `processing` | En proceso; resultado final retenido por el simulador | Consulta recupera aceptación simulada |
| `timeout-after` | Desconocido; recibo ya registrado | No reenvía; consulta recupera el mismo resultado/artefactos |
| `timeout-before` | Desconocido; sin recibo | Consulta devuelve no encontrado; segundo intento de la misma clave registra aceptación |
| `unavailable` | Fallo técnico explícitamente antes del registro | Segundo intento sobre el mismo documento puede aceptar |

Estado inicial `prepared`. Solo se simula envío desde preparado/no encontrado/fallo técnico. Consulta desde desconocido/en proceso. Administración puede descartar preparado/rechazado/no encontrado/fallo técnico; no se descarta un resultado desconocido, en proceso o aceptado. Descartar no es baja ni nota de crédito. La serie nunca se retrocede ni reutiliza al descartar. Mientras haya un documento activo, otro sobre el mismo cargo se rechaza.

Un cargo revertido impide preparar o simular otro envío desde ese origen. La consulta de una incertidumbre previa sigue disponible para preservar el resultado histórico. El módulo fiscal no modifica ni bloquea por su cuenta los saldos o las correcciones financieras existentes.

## Persistencia y futura sustitución

Migración 007: documentos/artefactos, eventos, solicitudes y recibos simulados append-only. Proyecciones y contadores mutables se reconstruyen de esos historiales. Bloqueo financiero de oficina antes del fiscal, revisión global y de documento. Registro, recibo del simulador, evento, auditoría y respuesta idempotente atómicos. Fallo de auditoría revierte también correlativo y artefactos.

El simulador es local y puro, por eso su recibo puede participar en la transacción de QA. **Un proveedor real no comparte esa transacción**: su futura adaptación exige outbox/trabajador durable, publicación de la intención antes de la red, idempotencia del proveedor, consulta tras timeout y conciliación de respuestas. No basta con cambiar `mode` o una variable de entorno; no existe ruta de ejecución real en esta entrega.

Pendientes para BK-26: emisor/series/certificado autorizados; selección y contrato de PSE/OSE, revisión jurídica/contable, reglas y XSD/catálogos actuales, anticipos/notas/bajas, escenarios de pago/crédito y conceptos de identidad aplicables; pruebas reales autorizadas y reconciliación operativa.

Fuentes consultadas: [guías oficiales SUNAT](https://cpe.sunat.gob.pe/guias-y-manuales), [tipos de comprobante](https://cpe.sunat.gob.pe/informacion_general/tipos_comprobantes_pago), [XSD UBL 2.1 de OASIS](https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd), [node-qrcode](https://github.com/soldair/node-qrcode). Reutilización trazada en [ledger](../evidence/reuse-ledger.md).

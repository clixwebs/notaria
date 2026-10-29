# Evidencia ejecutada · BK-19 local / Fase 4.2

29/10/2026 · America/Lima · **NotariaOS 0.4.2**. Contrato XML/QR y adaptador exclusivamente simulado, más regresión completa. [Entrega](../phase-4-2/ENTREGA.md), [contrato v1](../phase-4-2/CONTRATO-FISCAL.md), [ADR 0006](../adr/0006-contrato-fiscal-y-simulador-local.md).

## Entorno y resultados

Windows, Node24.20.0, Next16.4.3, React19.3.1, TS5.9.3, BetterAuth1.7.14, PGlite0.5.13, Kysely0.29.7 y Playwright1.64.1/Chrome. Versiones instaladas consultadas con `npm ls --depth=0`. Bibliotecas añadidas: qrcode1.5.4, @types/qrcode1.5.6 y jsqr1.4.0 (desarrollo); registros/documentación oficiales comprobados. Instalación informó cero vulnerabilidades conocidas; no equivale a auditoría de seguridad.

| Comando ejecutado | Resultado |
| --- | --- |
| `npm run build` | Correcto; incluye comprobación TypeScript |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm test` | **29 correctas**, cero fallos |
| `npm run test:e2e` | **46 correctas**, cero fallos/omitidas/reintentos; **106 941.193 ms** |
| `verify-fiscal-xsd.py` | **10 XML válidos contra XSD Invoice UBL 2.1**, 14 esquemas públicos OASIS |
| `verify-phase42-integrity.ts` | **12 grupos correctos**, en original y restauración |
| `verify-phase41-integrity.ts` | **7 grupos tarifarios correctos**, en original y restauración |
| `verify-phase4-integrity.ts` | **12 grupos financieros correctos**, en original y restauración |
| `compare-phase42-restoration.ts` | **22 tablas con filas exactamente iguales** entre QA y restauración CLI |
| `check-review-phase42.ts` | Acceso200, APIs/archivo anónimos401, /fiscal redirige a acceso, sin errores de página |

Archivos: [navegador/API](fase-4-2-e2e.json), [integridad fiscal](fase-4-2-integridad.json), [tarifas](fase-4-2-tarifas-integridad.json), [finanzas](fase-4-2-finanzas-integridad.json), [restauración](fase-4-2-restauracion.json), [revisión principal anónima](fase-4-2-revision-local.json), [XSD UBL](fase-4-2-xsd.json), [resumen](validacion-fase-4-2.json) y [fuentes SHA-256](fase-4-2-fuentes.json). La carpeta no tiene repositorio Git; el manifiesto identifica código/pruebas/configuración verificados.

## Qué prueban los escenarios

Nueve escenarios nuevos de `phase42.scenarios.ts`, junto a los 37 anteriores de fundamentos, expedientes, caja y tarifario, en `playwright.phase42.config.ts`/`phase42.spec.ts`. Base nueva **.notaria-phase42-qa-01**, nunca `.notaria/`. La suite mantuvo el rate limit real y esperó su ventana de60segundos ante429; no se desactivó MFA o autorización.

Se rechazaron origen ajeno, perfiles no autorizados, acceso sin sesión/TOTP, preparación/descarte por Caja, modo/URL/XML/importes arbitrarios, factura sin formato RUC y tratamientos incompletos. Los archivos fiscales no se sirven sin permiso. Caja no recibió asunto jurídico ni borrador por el módulo fiscal.

Preparación concurrente del mismo UUID produjo un solo documento/correlativo; otra petición sobre cargo activo fue rechazada. El reintento idéntico recuperó su respuesta original aun después de avanzar el estado. Otra carga o actor no reutiliza esa solicitud. Envío y consulta concurrentes conservaron una sola transición por solicitud.

Se recorrieron aceptación, rechazo, procesamiento, timeout antes/después del registro, no encontrado y fallo técnico. Desconocido bloqueó reenvío/descarte; consulta recuperó aceptación sin cambiar número, XML, QR o instantánea. No encontrado/fallo previo permitieron reintentar la misma clave. Descarte interno preservó historia y permitió otro número, sin llamarlo baja/CDR. Cargo revertido y fondos de terceros no fueron orígenes admitidos.

Caso exacto: honorarios118.00 gravados de prueba → base100.00/impuesto18.00; consulta de identidad0.10 inafecta de prueba y separada; total118.10. Los30.00 previstos para terceros quedaron fuera. Se comprobó que preparar/simular/consultar no modifican revisión financiera, número de movimientos ni deuda/anticipos/custodia/efectivo/obligaciones. Los supuestos de impuesto no se adoptan como política real de la notaría.

XML descargado leído con DOMParser: bien formado, namespace Invoice UBL correcto, texto escapado recuperado y huella coincidente. QR PNG servido autenticadamente leído a píxeles en navegador y decodificado por jsqr: coincide con cadena/total/impuesto/huella congelados y conserva el marcador SIM/SIN-FIRMA. No hubo solicitudes de red del recorrido UI fuera de localhost. El adaptador fiscal no tiene cliente de red ni ruta productiva.

## Integridad, fallos y reinicio

Cuatro historiales fiscales rechazan UPDATE/DELETE. Artefactos y snapshots verifican hashes y reconstrucción determinista. Proyección concuerda con último evento; correlativos con documentos y revisión de oficina con solicitudes confirmadas. Ámbito de oficina y perfiles se rechazan también desde los casos de uso.

Fallo deliberado de auditoría revirtió preparación, número, documento/archivos, evento, solicitud y estado. Fallo de envío revirtió también el recibo del simulador. Adaptador inyectado con otra clave o huella no produjo aceptación; la transición conservadora fue desconocido, también revertida por el fallo auditado. Se compararon hashes de tablas fiscales y financieras antes/después para excluir efectos parciales.

El verificador fiscal agrega **solo en QA** un documento de recuperación si no existe, lo deja en timeout posterior/desconocido y congela la base. Al cargar una copia restaurada en otro motor PGlite, consulta ese recibo durable, obtiene aceptación una sola vez por UUID y conserva referencia, XML, serie y estado financiero. La base de origen mantiene ese caso desconocido: la resolución ocurre únicamente en la restauración de prueba en memoria. No se agregaron muestras a rutas principales o a la instalación de revisión.

Estado QA final: **10documentos,26eventos,26solicitudes fiscales,8recibos simulados y2series**. Financieros:38entradas,47solicitudes,3aperturas y2cierres; saldos sintéticos reproducidos: deuda907.21,anticipos5.20,terceros100.00,efectivo100.00. La deuda adicional proviene de cargos explícitos creados por la preparación de escenarios QA, no de una acción fiscal.

## Copia, restauración y servicios

Servidor principal real8076 identificado desde Windows y detenido antes de copia válida **backups/local-2026-10-29T10-22-39-022Z**. No se usó una inspección restringida vacía como prueba de base cerrada. Build/servidor/Chrome ejecutados con permiso apropiado en Windows por los límites de enlaces/localhost del sandbox conocidos desde4.1.

Con QA detenida, se ejecutó:

```powershell
npx tsx scripts/verify-phase42-integrity.ts .notaria-phase42-qa-01
npx tsx scripts/verify-phase41-integrity.ts .notaria-phase42-qa-01
npx tsx scripts/verify-phase4-integrity.ts .notaria-phase42-qa-01
npm run backup:local -- .notaria-phase42-qa-01
npm run restore:local -- backups/local-2026-10-29T10-40-53-743Z .notaria-phase42-restaurada-qa-01
```

Los tres verificadores se ejecutaron también sobre `.notaria-phase42-restaurada-qa-01`, correctos. Luego `npx tsx scripts/compare-phase42-restoration.ts .notaria-phase42-qa-01 .notaria-phase42-restaurada-qa-01` confirmó filas idénticas de22tablas fiscales/comerciales/financieras. Los verificadores previos solo ampliaron nombres QA admitidos y salida separada para4.2; no aceptan la principal. Cada copia/restauración/verificación tuvo un solo propietario por carpeta.

QA y restaurada detenidas. Revisión principal activa en **http://127.0.0.1:3100/fiscal**, base `.notaria/`, sin alta QA ni documentos fiscales precargados. Acceso/denegación anónima verificados con navegador nuevo. Referencias ELDIAL solo leídas como código; sin secretos/BD de clientes, ejecución, modificación o publicación de esos proyectos.

## Validación estructural UBL

Con QA detenida, `npx tsx scripts/export-phase42-xml.ts .notaria-phase42-qa-01` exportó diez XML sintéticos a una subcarpeta ignorada de esa QA. `python scripts/verify-fiscal-xsd.py .notaria-phase42-qa-01/xml-validation` descargó únicamente XSD públicos de OASIS y validó todas las instancias localmente con lxml6.1.1. No se envió contenido de comprobantes a ninguna URL. Los catorce esquemas y las diez instancias quedan identificados por SHA-256 en el informe. Los esquemas se guardaron temporalmente y no se añadieron al proyecto.

El primer intento encontró el esquema agregado de más de2MB; se elevó el límite de descarga a8MB por esquema. La primera resolución local usó separadores Windows en schemaLocation; se normalizaron a rutas URI. La ejecución final pasó completa, sin cambiar el XML de la aplicación. Un XSD válido no acredita condiciones tributarias, firma o aceptación del documento.

## Interfaz y límites

Capturas: [1440px](fase-4-2-fiscal-1440.png), [683px](fase-4-2-fiscal-683.png), [390px](fase-4-2-fiscal-390.png), [diálogo oscuro](fase-4-2-fiscal-oscuro.png). Inspección visual móvil/oscuro realizada. Axe sin violaciones en página fiscal en tres anchos y diálogo oscuro; no hubo desbordamiento horizontal del documento, errores de página ni pérdida de foco al cerrar con Escape. La tabla es desplazable con teclado. Se conserva la regresión visual anterior; no se afirma conformidad WCAG completa.

La validación estructural XSD UBL base pasó en los diez XML de prueba, incluidos factura y boleta; no prueba reglas/catálogos SUNAT completos, firma, certificado, CDR, PSE/OSE, impuestos reales ni emisión. PEN, factura/boleta, precios finales y tratamiento del ejercicio explícito. Sin notas/bajas, anticipos fiscales, cuotas/crédito, descuentos o detracciones. El proveedor real requerirá contrato, outbox/reconciliación y autorización BK-26. Procedimientos BK-14–17 y piloto/seguridad operativa siguen pendientes. No se conectó ningún proveedor, no se emitió a SUNAT ni se publicó.

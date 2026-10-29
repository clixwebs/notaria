# ADR 0006 · Contrato fiscal y simulador local

Estado: implementado para revisión local, 29/10/2026 · 0.4.2. André autorizó BK-19 XML/QR y adaptador simulado, expresamente sin proveedores reales ni emisión SUNAT. Conserva identidad ELDIAL/Clix y núcleo transaccional.

## Decisión

Crear un módulo fiscal de prueba separado de caja. Su origen es un cargo propio persistente de presupuesto aceptado, con sus conceptos y versión inmutables. El tratamiento del ejercicio es explícito por línea y no se infiere de Honorarios/Otros ni se aplica a Terceros. Los precios finales se conservan, se desglosa el supuesto de impuesto sin tocar deuda, cobros, anticipos, gastos o custodia.

El contrato `notariaos-fiscal-sim-v1` produce XML inspirado en UBL 2.1 y QR decodificable con marcador de simulación. Emisor de RUC ficticio fijo, series SIM por oficina/tipo y sin firma, endpoints externos, claves o configuración de producción. Los archivos y respuestas dicen que no tienen validez tributaria. No se presenta la aceptación local como CDR o aceptación SUNAT.

Migración 007 aditiva. Documentos/artefactos, solicitudes, eventos y recibos del simulador son append-only. Contador de serie y proyección de estado son mutables, auditados y reconstruibles. Orden de bloqueos: estado financiero, estado fiscal, consulta de origen; no introduce la inversión de bloqueos respecto de caja. Revisión optimista global/documento, UUID/huella canónica/actor/oficina, restricción de un documento activo por cargo y correlativo único por oficina/tipo. Preparación, artefactos, auditoría y resultado se confirman juntos.

El adaptador local conserva una clave y huella estables, distintas de la UUID de cada petición del usuario. Una respuesta debe concordar con ambas. Simula aceptación, rechazo, procesamiento, timeout previo/posterior y fallo técnico previo. Desconocido no se equipara a rechazo ni éxito: bloquea nuevo envío y exige consulta. No encontrado habilita reintento del mismo documento/clave. Un descarte autorizado conserva la serie histórica y no es una baja fiscal.

Administración prepara y descarta; Administración/Caja leen, descargan, simulan envío y consultan. Todas las mutaciones con TOTP y sesión reciente; permisos y ámbito en API/casos de uso, auditoría atómica. Caja solo recibe datos administrativos/comerciales y receptor de prueba, sin el asunto o borrador jurídico. Las descargas verifican hash, generan evidencia de acceso y usan `private, no-store`.

## Reutilización y bibliotecas

Se revisaron únicamente los módulos de código puro `smartpse-xml.ts` y `sunat-qr.ts` de ELDIAL, junto a las declaraciones estáticas del adaptador. Se adaptaron el orden conceptual XML/QR y la separación documento/respuesta. Se reescribieron cálculos con BigInt/cadenas; se excluyeron las operaciones Float, configuración/credenciales, envío real y fallback de documento desconocido a DNI ficticio automático. Origen y límites en [ledger](../evidence/reuse-ledger.md).

`qrcode` 1.5.4 genera PNG local, `@types/qrcode` 1.5.6 tipa la API y `jsqr` 1.4.0 se usa como decodificador independiente solo en pruebas. Versiones verificadas en el registro y documentación oficial; licencias MIT conservadas en paquetes. No se incorporó cliente de proveedor fiscal.

## Alternativas y límites

Reutilizar directamente el cliente SmartPSE habría arrastrado configuración de red y reglas retail de importes; queda excluido por la instrucción activa. Tratar un timeout como rechazo permitiría duplicados; se conserva incertidumbre y consulta. Añadir impuestos al cargo alteraría acuerdos financieros existentes; se usa solo un desglose de ejercicio de precios finales.

El contrato de producción exige decisiones tributarias y de proveedor pendientes; esta simulación permite probar la frontera sin inventar esa habilitación. Sus diez XML QA pasan la estructura XSD Invoice UBL 2.1 de OASIS; no están homologados integralmente contra catálogos/reglas SUNAT. Su QR no es fiscal y no contiene firma digital. Un adaptador real necesita outbox/trabajador, intención durable antes de la red, idempotencia/consultas y reconciliación operativa; el recibo local transaccional no prueba esas capacidades externas.

Ver [contrato detallado](../phase-4-2/CONTRATO-FISCAL.md), [entrega](../phase-4-2/ENTREGA.md) y [evidencia](../evidence/fase-4-2.md). BK-26 real, procedimientos instrumentales BK-14–17 y preparación del piloto permanecen pendientes.

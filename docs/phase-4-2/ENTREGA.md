# Fase 4.2 · BK-19 local: XML/QR y adaptador simulado

NotariaOS **0.4.2**, 29/10/2026. Entrega local solicitada por André. Una notaría peruana, identidad ELDIAL/Clix conservada: acceso, Montserrat, negro tinta #0D1728, azul #174EA6, barra superior compacta, móvil y oscuro.

## Cómo revisarlo

1. Ingresar con cuenta propia y TOTP al [laboratorio fiscal](http://127.0.0.1:3100/fiscal), también en **Más → Fiscal · pruebas** y navegación móvil. Administración/Caja tienen acceso.
2. Debe existir presupuesto aceptado y cargo propio explícito en Caja. No basta aceptar la propuesta ni recibir un anticipo. Se ofrecen cargos no revertidos y sin otro documento de prueba activo.
3. Administración usa **Preparar documento de prueba**, elige el cargo, factura/boleta y receptor de prueba. La factura requiere formato RUC; no se consulta su existencia. La boleta de este corte siempre identifica receptor.
4. Elegir expresamente un supuesto de impuesto por concepto propio y marcar las consultas de identidad como concepto separado cuando corresponda. Terceros no se ofrece ni se incluye en el importe. Los precios finales y total del cargo se conservan; el desglose no mueve dinero ni altera deuda.
5. Elegir escenario y confirmar que es simulación. Se congelan XML, QR, instantánea y hashes. La serie interna SIM no es serie autorizada. Emisor fijo ficticio, sin firma ni validez tributaria.
6. **Ver documento** permite descargar XML, QR y respuesta JSON simulada. Los archivos están protegidos y sus accesos se auditan. El QR puede leerse con un lector; comienza con `NOTARIAOS:SIMULACION:v1`, incluye importes/huella y termina con `SIN-FIRMA`.
7. **Simular envío local** solo ejecuta el adaptador local. En timeout posterior o procesamiento, **Consultar resultado simulado** recupera el resultado del mismo documento sin reservar otro número. En timeout previo, la consulta devuelve no encontrado y permite reintentar ese documento. Un fallo técnico previo permite reintento. Ningún escenario usa red.
8. Un rechazo o borrador puede descartarse por Administración con motivo; el historial y número anterior permanecen. No se descarta un estado desconocido/en proceso/aceptado. No hay baja fiscal ni nota de crédito. Revertir el cargo impide preparar o simular un nuevo envío desde ese origen, conservando sus documentos históricos.

## Permisos y persistencia

| Acción | Administración | Caja | Otros perfiles |
| --- | --- | --- | --- |
| Consultar/descargar | Sí | Sí | No |
| Preparar/descarte interno | Sí | No | No |
| Simular envío/consulta | Sí | Sí | No |

Mutaciones con segundo factor y sesión reciente de 15 minutos. Ámbito/permiso comprobados en servidor; Caja sigue sin acceso al contenido jurídico por este módulo.

Migración 007 aditiva a 001–006. Documentos/artefactos, eventos, solicitudes y recibos simulados inmutables. Revisiones, clave de documento/huella, solicitudes idempotentes y correlativos coordinados con auditoría. Contadores y estado proyectado reconstruibles. Un fallo de auditoría revierte todo el conjunto local, sin confirmar números o archivos parciales.

Antes de migrar se identificó y detuvo el servidor real desde Windows, y se creó copia cerrada principal `backups/local-2026-10-29T10-22-39-022Z`. QA utiliza `.notaria-phase42-qa-01`, separada de `.notaria/`; no se crearon cuentas QA en la principal. Copia/restauración siempre con servidor propietario detenido. Base y claves permanecen privadas/ignoradas.

## Resultado y pendientes

BK-19 queda implementado en su **corte local de contrato XML/QR y adaptador simulado**. Se verifican 29 unitarias, 46 escenarios de navegador/API y regresión de caja/expedientes/tarifas. Los diez XML QA pasan el XSD Invoice UBL 2.1; se verifican integridad, recuperación de resultado desconocido tras reinicio y restauración CLI en QA. Resultados exactos/capturas en [evidencia](../evidence/fase-4-2.md).

Especificación en [contrato fiscal v1](CONTRATO-FISCAL.md); decisiones en [ADR 0006](../adr/0006-contrato-fiscal-y-simulador-local.md). Referencias de código puro solo leídas, sin ejecutar/modificar ElDial ni consultar secretos/bases de clientes.

**No habilita emisión real:** tratamiento fiscal de servicios/consultas, reglas y XSD/catálogos completos, firma, emisor/series, PSE/OSE y CDR reales siguen pendientes para BK-26. No se conectaron proveedores ni SUNAT, no se enviaron pagos ni se publicó. Las constancias de Caja siguen siendo internas. Procedimientos instrumentales BK-14–17, cumplimiento y puertas de seguridad/operación del piloto conservan su alcance pendiente.

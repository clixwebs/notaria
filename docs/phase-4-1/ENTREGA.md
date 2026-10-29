# Fase 4.1 · Tarifario administrable

NotariaOS 0.4.1 · 29/10/2026 · revisión local de una notaría. Conserva login, Montserrat, componentes, negro tinta #0D1728, azul #174EA6, barra superior y modo oscuro ELDIAL/Clix.

## Corte elegido y dependencias

Se comprobó el código 0.4.0 y la entrega financiera. BK-18/33 conservaban pendiente el tarifario, dependencia del contrato fiscal BK-19. Se implementó este corte comercial sin inventar reglas tributarias ni precisar datos imprescindibles adicionales. No se avanza a cumplimiento ni se declara completa la fase 3 instrumental o la fase fiscal.

La lista de servicios y precios reales debe registrarla Administración; el catálogo empieza vacío. El tratamiento tributario, condiciones fiscales de cada concepto y contrato XML/QR requieren validación para el siguiente corte. Proveedores y emisión reales conservan autorización separada. Las constancias financieras actuales siguen siendo internas.

## Cómo revisarlo

1. Entrar con cuenta propia y TOTP en [Tarifario](http://127.0.0.1:3100/tarifario), también disponible en **Más → Tarifario** y navegación móvil.
2. Administración usa **Nueva tarifa**: código estable, descripción, clasificación, acto específico o todos, importe decimal en soles, disponibilidad y motivo. Una publicación es inmediata; no genera cargo ni movimiento.
3. **Nueva versión** conserva versiones anteriores. Desmarcar disponibilidad publica la desactivación. El historial muestra importe, texto, clasificación, acto, responsable y motivo de cada versión.
4. En el presupuesto de un expediente, elegir **Tarifa del concepto**. El catálogo solo ofrece conceptos activos para ese acto. Cantidad y total se calculan exactamente. La propuesta guardada muestra código y versión de origen.
5. Cambiar descripción, clasificación o precio convierte la línea en manual, de forma visible en el selector. Cambiar cantidad conserva procedencia. Siguen admitiéndose conceptos manuales.
6. Una tarifa cambiada o desactivada desde otra sesión produce conflicto al guardar una selección anterior. Actualizar tarifas y volver a seleccionar conserva el trabajo del formulario. En publicación, **Actualizar contexto sin cerrar** conserva los valores y muestra revisión/versión que se usarán.
7. Aceptaciones, órdenes de servicio y cargos anteriores conservan sus importes aun al cambiar o desactivar tarifas. El cargo explícito sigue excluyendo Terceros, sin compensar anticipos ni custodia.

## Persistencia, permisos y resguardo

Migración 006 aditiva a 001–005. `tariff_items`, `tariff_versions`, `tariff_requests` y `case_quote_tariffs` son inmutables. Revisión, versión base, bloqueo por oficina, idempotencia por UUID/huella/actor y auditoría transaccional. Selección validada en servidor y vínculo referencial de propuesta a versión histórica. Los presupuestos previos no se reescriben.

Administración publica; todos los roles internos existentes consultan. Recepción conserva su permiso comercial; Caja sigue sin acceso jurídico por consultar tarifas. Mutaciones de tarifa exigen TOTP y sesión reciente. No se agregan cuentas QA a `.notaria/`; pruebas en bases nuevas `.notaria-phase41-qa-*`, con un solo proceso propietario y servidor detenido para verificaciones/copias.

El servidor principal fue identificado desde Windows y detenido antes de la copia válida previa a migración: `backups/local-2026-10-29T08-47-33-352Z`. El primer diagnóstico dentro del sandbox no veía ese proceso; no usar su copia anterior como evidencia de respaldo cerrado. No se consultaron secretos ni bases de clientes de las referencias.

## Trazabilidad y pendientes

| Historia | Entregado en 4.1 | Pendiente |
| --- | --- | --- |
| BK-18 | Tarifario administrable y versiones, sumado a cargos/caja previos | Tratamiento tributario validado |
| BK-33 | Líneas de presupuesto trazadas a tarifa y precio aceptado estable | Emisión fiscal |
| BK-19 / BK-26 | Sin implementación fiscal nueva | Contrato XML/QR, adaptador simulado, demo real y habilitación separada |
| BK-14–17 | Sin modificación del alcance instrumental previo | Plantillas jurídicas, identificación, otorgamientos, numeración, diligencia/entrega |

Decisiones en [ADR 0005](../adr/0005-tarifario-versionado.md). Resultados ejecutados, entornos, capturas y limitaciones en [evidencia de fase 4.1](../evidence/fase-4-1.md).

No hay descuentos automáticos, fórmulas, varias monedas, tarifas programadas, liquidación de impuestos ni operación habilitada. PostgreSQL gestionado, antivirus/cifrado, recuperación operativa, revisión jurídica/contable y demás puertas del piloto siguen pendientes. Sin publicación, servicios externos o pagos enviados.

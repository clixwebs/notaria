# Fase 6 · Integraciones, alcance local integrado

NotariaOS 0.7.0 · 29/10/2026. BK-24, BK-25 y BK-26 atendidos juntos en su alcance local autorizado, sin subfases. **La fase real no está cerrada:** contratos/accesos/dispositivos y pruebas reales son condiciones del plan, todavía pendientes. [Dependencias por historia](DEPENDENCIAS.md), [ADR0010](../adr/0010-integraciones-locales-y-traslado-asistido.md), [evidencia ejecutada](../evidence/fase-6.md).

## Recorrido

Más → Integraciones y traslados. Los tres canales muestran su bloqueo real y dependencias. Administración/Notario registra evaluaciones por versión con condiciones comprobadas, pendientes y responsable declarado; no activa proveedores.

1. **Identidad y lector:** registrar prueba local del contrato, describiendo situación del equipo. Conserva coincidencia/no coincidencia/error/desconocido. No detecta hardware, captura biometría ni altera la identificación del expediente. El adaptador de identidad continúa fijo en simulación.
2. **Firma y traslado asistido:** preparar manifiesto interno de un instrumento SIM activo. Congela documento/origen/hash, sin firma o presentación. Solo Notario registra validación simulada. Inválida/revocada/indisponible bloquean cargo; favorable simulado permite cargo simulado de esa huella y última evaluación.
3. Para un archivo trabajado fuera del ERP: cargar/revisar mediante Documentos una versión privada de un participante. Registrar **Seguimiento de archivo externo**, seleccionar esa versión. Notario declara informe de firma con su versión privada separada, validador, fecha y resultado. El ERP no verifica criptografía. Cargo requiere evaluación favorable de la huella exacta, archivo privado del cargo, fecha y referencia. Todos los estados conservan **declarado, no verificado**; un archivo liberado no acredita firma.
4. Agregar seguimiento por cargo exacto. Observado/subsanado/inscrito/tachado/desconocido conserva el origen simulado/declarado. Preparar/descargar nunca presenta. El cargo congela la evaluación; otro archivo o corrección requiere nuevo registro y no reescribe el anterior.
5. **Facturación:** capturar evidencia declarada de demo externa para XML SIM exacto, fecha, referencia, resultado y sustento. No ejecuta demo, verifica CDR ni modifica estado fiscal, caja, series o saldos. El simulador fiscal conserva sus flujos de consulta tras timeout.

Administración/Recepción/Abogado/Notario consulta los canales de procedimiento; firma/informe/cargo solo Notario. Fiscal solo Administración/Caja. Caja no ve expedientes/archivos de traslado y Notario no adquiere acceso fiscal. API verifica permisos/oficina/TOTP/origen/sesión reciente. PLAFT sigue separado. Formularios conservan datos tras conflicto y actualizan contexto explícitamente; Escape devuelve foco. ELDIAL/Clix, Montserrat, negro/azul, oscuro y móvil conservados.

Migración 011 aditiva; cuatro tablas inmutables y revisión por oficina/canal. UUID/hash/actor, cadena de eventos, auditoría transaccional. No se reconstruyó proyecto, precargó catálogo o añadieron dependencias. SUNAT real, proveedores, formato SBS/OCP oficial y comunicaciones externas permanecen deshabilitados.

## Validación

Suite `playwright.phase6.config.ts` / `tests/e2e/phase6.spec.ts`: regresión previa más casos nuevos en base `.notaria-phase6-qa-*` nueva y separada. `npm test`, build, TypeScript y lint; verificador de integridad y comparación de restauración con guardia Windows. Los resultados y límites definitivos se registran en [evidencia](../evidence/fase-6.md). No confundir pruebas de ingeniería con homologación, hardware probado o piloto autorizado.

Cierre ejecutado: **52 unitarias y 83 E2E/API correctas**, 0 fallos/omitidas/reintentos. 15 grupos de integridad en original/restaurada y 51 tablas iguales, con bytes privados. Build/TypeScript/lint correctos. QA-03/restaurada detenidas; principal 3100 reabierta sin altas QA. La fase real conserva íntegramente sus condiciones pendientes.

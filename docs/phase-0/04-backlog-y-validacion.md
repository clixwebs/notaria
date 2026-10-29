**Estado vigente · fase 6, alcance local integrado (0.7.0):** BK-24–26 se trabajan juntos, sin subfases. Contrato de identidad/diagnóstico local sin hardware; firma simulada, traslado de ejercicio y archivo externo con informe/cargo/seguimiento declarados; evidencia de demo externa por XML exacto, sin cambiar fiscal o dinero. [Entrega](../phase-6/ENTREGA.md), [ADR0010](../adr/0010-integraciones-locales-y-traslado-asistido.md), [dependencias](../phase-6/DEPENDENCIAS.md), [evidencia](../evidence/fase-6.md). **La fase 6 real NO está cerrada:** convenio/lector RENIEC, certificado/validador/canal SID y proveedor/cuenta demo/autorización siguen pendientes. Sin conexiones, presentación, comunicaciones o SUNAT real. El estado anterior se conserva como antecedente.

# Backlog y validación

**Estado vigente · fase 5 local (0.6.0):** BK-21–23 entregados juntos, sin subfases: reserva PLAFT y revisión humana; finalidades/avisos/consentimiento, ARCO, incidentes y conservación; exportaciones internas inmutables validadas con cargo separado. [Entrega](../phase-5/ENTREGA.md), [ADR0009](../adr/0009-cumplimiento-local-reservado.md), [evidencia](../evidence/fase-5.md). Formato oficial SBS/OCP deshabilitado hasta anexos/régimen/homologación; no hay envío ni aceptación automática. Políticas y responsables operativos requieren validación. SUNAT real sigue deshabilitado. Siguiente fase original6 condicionada a autorización/convenios. Los estados anteriores siguientes son historia.


**Estado vigente · fase 3 integrada (0.5.0):** André confirmó entregar BK-15 a BK-17 juntos y retomar fases enteras. Se completa el bloque local del procedimiento con identificación simulada/contingencias/excepción del Notario, comparecencia por versión, registro y folios SIM concurrentes, certificación, cartas con intentos/resultados/constancia y entrega separada. [Entrega vigente](../phase-3/ENTREGA.md), [ADR0008](../adr/0008-procedimiento-instrumental-local.md). Fase 3 local integra BK-13–17 y presupuesto BK-33; la aprobación jurídica y operación real siguen condicionadas. Fase 4 económica local ya implementada, incluido tarifario y fiscal simulado; siguiente bloque original fase 5, sin crear más subfases decimales. BK-24–26 reales permanecen pendientes y SUNAT real deshabilitado. Los estados 4.1–4.3 siguientes son antecedentes históricos.


Plan para una notaría, 29/10/2026. Actualización: BK-01 a BK-06 implementados como prototipo sintético para revisión; BK-07 a BK-12 tienen implementación local de prueba en fase 2; límites de cada historia en la [entrega vigente](../phase-2/ENTREGA.md). BK-13 y el núcleo de versiones/revisión de BK-14 están implementados localmente junto al presupuesto BK-33. El motor local de plantillas de BK-14 se completa en 0.4.3; textos jurídicos operativos y BK-15–17/BK-21–32 siguen pendientes. BK-18/20 y BK-33–36 tienen el corte financiero local de [fase 4](../phase-4/ENTREGA.md); el tarifario estaba pendiente al cierre de fase 4 y se completa localmente en 4.1; contrato XML/QR y adaptador simulado de BK-19 se completan localmente en 4.2; emisión real sigue pendiente. [Entrega de fase 3](../phase-3/ENTREGA.md). Ver [entrega de fase 1](../phase-1/ENTREGA.md) y [ampliación BK-33 a BK-42](../phase-1/backlog-ampliado.md). El tamaño es relativo: S acotado, M moderado, L varias piezas o riesgo significativo. No representa jornadas ni compromiso de fecha.

**Estado 4.1:** completado el tarifario comercial local de BK-18/33: versiones, disponibilidad, permiso de Administración, reintentos y procedencia en líneas de presupuesto, sin alterar aceptaciones. [Entrega](../phase-4-1/ENTREGA.md). BK-18 conserva revisión tributaria; BK-19 estaba pendiente al cierre 4.1 y su corte local se entrega en 4.2. BK-14–17 conservan trabajo instrumental y validación jurídica. La siguiente entrega económica se ordena por BK-19, después de este tarifario; BK-26 real requiere autorización separada.

**Estado 4.2:** BK-19 tiene [contrato XML/QR de prueba y adaptador simulado implementados](../phase-4-2/ENTREGA.md), con claves/huellas estables, incertidumbre/consulta, artefactos, permisos y auditoría. **BK-19 local** queda probado; contrato operativo completo, impuestos, reglas/catálogos SUNAT, firma, CDR y habilitación real continúan en BK-26 y revisión tributaria. La prueba XSD base de 4.2 no acredita esas reglas. No confundir aceptación del simulador con SUNAT.

**Estado BK-14 / 4.3:** completado localmente el motor de [plantillas jurídicas](../phase-4-3/ENTREGA.md): variables tipadas, versión publicada por Abogado/Notario, selección explícita de intervinientes de instantáneas, vista previa y generación inmutable con procedencia. AC-06/07 cubiertos por concurrencia y conservación histórica. La publicación del texto base no revisa ni autoriza el instrumento generado. Catálogo vacío; textos propios y validación jurídica operativa, DOCX/PDF/formato avanzado siguen pendientes. BK-15–17 conservan sus dependencias y BK-26 real permanece deshabilitado.

## 1. Historias por entrega

| ID | Fase | Historia y resultado observable | Dependencia | Tamaño |
| --- | --- | --- | --- | --- |
| BK-01 | 1 | Extraer tema y piezas compatibles de ElDial con registro de origen; mostrar marca provisional | Aprobación fase 1 | M |
| BK-02 | 1 | Navegar acceso/MFA sintético, inicio y bandeja sin rutas rotas | BK-01 | M |
| BK-03 | 1 | Crear/consultar expediente sintético y sus participantes/requisitos | BK-02 | M |
| BK-04 | 1 | Recorrer identidad, revisión documental, caja y entrega con simulación visible | BK-03 | L |
| BK-05 | 1 | Demostrar carta/diligencias y certificación con diferencias de flujo | BK-03 | M |
| BK-06 | 1 | Validar teclado, estados, escritorio/tablet/móvil y captura de evidencia | BK-04/05 | M |
| BK-07 | 2 | Verificar versiones y decidir biblioteca/proveedor de auth con MFA/recuperación/revocación | Stack compatible, requisitos | M |
| BK-08 | 2 | Implementar sesiones, roles, permisos por acción/recurso y reautenticación | BK-07 | L |
| BK-09 | 2 | Crear esquema inicial y configuración de una notaría/oficinas, sin datos reales | Modelo revisado | M |
| BK-10 | 2 | Implementar carga/descarga privada, versiones, límites y cuarentena | BK-08/09 | L |
| BK-11 | 2 | Registrar evidencia durable de acciones críticas y accesos sensibles | BK-08/09 | L |
| BK-12 | 2 | Fichas de personas, documentos y representación mínima; acceso restringido | BK-08/09/10 | M |
| BK-13 | 3 | Expedientes/actos, participación, requisitos versionados, tareas y observaciones | BK-12 | L |
| BK-14 | 3 · local 0.4.3 | Documento/plantilla con variables tipadas, revisión y conflicto concurrente; catálogo jurídico operativo por validar | BK-10/13 | L |
| BK-15 | 3 · local implementado | Identificación simulada con resultados/contingencias y excepción por notario | BK-08/11/13 | M |
| BK-16 | 3 · local implementado | Registro, numeración concurrente y otorgamientos/autorización por versión | BK-14/15, validación de negocio | L |
| BK-17 | 3 · local implementado | Certificación y cartas con intentos/resultados, constancias y entrega | BK-13/15 | L |
| BK-18 | 4 | Tarifario, cargos, anticipos, pagos/aplicaciones y devoluciones con decimal | BK-09/13, reglas tributarias | L |
| BK-19 | 4 | Reutilizar contrato XML/QR y adaptar proveedor de comprobantes simulado | BK-18, contrato fiscal revisado | L |
| BK-20 | 4 | Caja, cierre, diferencias y conciliación; reintentos idempotentes | BK-18/19 | L |
| BK-21 | 5 · local implementado | Diligencia/riesgo y bandeja reservada PLAFT con revisión humana | BK-08/11/13, régimen validado | L |
| BK-22 | 5 · local implementado | Finalidades, avisos/evidencia, ARCO, incidentes y retención/bloqueo legal | BK-08/10/11, política aprobada | L |
| BK-23 | 5 · local implementado | Exportación regulatoria versionada y validación del archivo | BK-21, formato/anexos vigentes | M |
| BK-24 | 6 · spike local; real pendiente | Spike lector/canal RENIEC y adaptador real autorizado con pruebas | Convenio/dispositivo, BK-15 | L |
| BK-25 | 6 · flujo asistido local; real pendiente | Firma, validación, traslado, cargo y seguimiento asistido SUNARP | Certificado/canal, BK-16 | L |
| BK-26 | 6 · evidencia declarada; demo real pendiente | Facturación demo real y conciliación de respuestas; habilitación separada | Cuenta/proveedor, BK-19/20 | M |
| BK-27 | 7 | Agenda y modo sala con información del compareciente activo | BK-13/15/16 | M |
| BK-28 | 7 | Portal limitado por relación con expediente y recurso | BK-08/10/13/22 | L |
| BK-29 | 7 | Notificaciones autorizadas con contenido mínimo, entrega y preferencias | Proveedor, BK-22/28 | M |
| BK-30 | 8 | Carga, revisión externa de seguridad, accesibilidad y correcciones | Núcleo e integraciones candidatas | L |
| BK-31 | 8 | Restaurar BD/documentos/llaves y demostrar recuperación | Infraestructura seleccionada | M |
| BK-32 | 8 | Migración ensayada/conciliada, manuales, capacitación y piloto autorizado | Origen si aplica, BK-30/31 | L |

Los trabajos transversales de seguridad, privacidad, pruebas y documentación forman parte de cada historia; no se posponen íntegramente a BK-30. Los convenios y revisiones legales son dependencias externas con responsable, sin fecha ficticia.

## 2. Cortes funcionales

1. **Prototipo:** BK-01 a BK-06, siempre sintético. Aprueba lenguaje, densidad y recorrido.
2. **Núcleo interno de prueba:** BK-07 a BK-17, con documentación y evidencia desde la base. Demuestra el caso completo en BD aislada.
3. **Producto integrado de prueba:** finanzas + cumplimiento + integraciones habilitadas. Ninguna pantalla simulada se confunde con respuesta real.
4. **Piloto operativo:** revisión jurídica/tributaria, seguridad, recuperación y capacitación; actos y perfiles habilitados expresamente.

No denominar al segundo corte listo para operar por tener documentos y números. Un componente sin acceso externo no se habilita en producción.

## 3. Trazabilidad de los criterios del prompt

Todos los AC provienen del prompt v2.0. La decisión de una sola notaría modifica su aplicación sin eliminar la necesidad de controlar accesos.

| Criterio | Historia/área | Validación prevista |
| --- | --- | --- |
| AC-01 | BK-08/10/12/28 | Sustituir prueba entre tenants por aislamiento de entornos y denegación por recurso/rol; oficina cuando exista restricción aprobada |
| AC-02 | BK-08 | Invocación directa sin permiso produce rechazo, sin depender de UI |
| AC-03 | BK-15/16 | No avanza acto con interviniente requerido sin evidencia/excepción habilitada |
| AC-04 | BK-15/24 | No coincidencia, error técnico y estado desconocido se conservan distintos |
| AC-05 | BK-16 | Solicitudes paralelas no duplican número; incidencias permanecen |
| AC-06 | BK-14 | Conflicto de edición detectado; versión aprobada/firmada intacta |
| AC-07 | BK-12/14/16 | Actualizar ficha/plantilla no cambia instrumento histórico |
| AC-08 | BK-18/19/20/26 | Repetición de petición/webhook conserva un único efecto; consulta tras timeout |
| AC-09 | BK-19/26 | Concepto RENIEC separado y cálculo tributario validado |
| AC-10 | BK-20 | Cierre reproducible y compensación trazable |
| AC-11 | BK-10/11 | Lectura/exportación autorizada; expiración/canje según contrato |
| AC-12 | BK-11 | Alteración detectada con anclaje independiente; fallo de registro no omite evidencia crítica |
| AC-13 | BK-08/21/28 | Roles generales/clientes sin datos reservados en contenido o metadatos |
| AC-14 | BK-22 | Incidente aplicable calcula desde hito pertinente; no aplicable conserva decisión fundada |
| AC-15 | BK-22 | Solicitud ARCO con identidad/plazo/respuesta; conservación impide borrado indebido |
| AC-16 | BK-25 | Firma inválida, revocada o validación indisponible no produce éxito ficticio |
| AC-17 | BK-23/25 | Exportación o documento sin cargo no se marca presentado/aceptado |
| AC-18 | BK-19/24/25 | Sustitución de adaptador sin cambios en dominio; equivalencia de capacidades comprobada |
| AC-19 | Registro modular | Módulo acotado agregado mediante puntos de extensión, sin alterar reglas de otros |
| AC-20 | BK-08/28 | Revocación efectiva en servidor y descargas; reautenticación sensible |
| AC-21 | BK-31 | Restaurar copia aislada de esta notaría con documentos/llaves; no escribir sobre producción |
| AC-22 | BK-06/30 | Recorridos por teclado y tamaños objetivo; controles visibles y utilizables |

AC-01/21 ya no implican desplegar dos notarías independientes para probar un alcance que el usuario excluyó. Si se amplía el producto, habrá que restituir pruebas de tenancy y revisar arquitectura.

## 4. Pruebas y evidencia por nivel

| Nivel | Qué verifica | Dónde importa |
| --- | --- | --- |
| Dominio puro | Estados, requisitos, permisos, dinero, plazos y errores | Cada regla comprometida |
| Integración PostgreSQL | Restricciones, transacciones, concurrencia y aplicaciones | Numeración, pagos, cierre y auditoría |
| Contrato de proveedor | Resultado, códigos, timeout, idempotencia y recuperación | Identidad, facturación, firma y mensajería |
| E2E | Acceso y recorrido completo del perfil | Recepción, redacción, notario, caja y portal |
| Visual/manual | Legibilidad, foco, zoom, teclado e impresión | Pantallas/tamaños previstos y documentos extensos |
| Operación/seguridad | Restauración, reserva, revocación y fallos | Antes del piloto y después de cambios relevantes |

Datos sintéticos sin derivarlos de clientes reales. Reloj y proveedores controlados para errores/plazos. No demostrar transacciones concurrentes solo con mocks. Registros de evidencia con comando, entorno, revisión de código, fecha, resultado y limitación.

Cuando exista aplicación: lint, TypeScript, pruebas pertinentes y build. En fase 0 solo se valida documentación, referencias y consistencia. No ejecutar tests/build de ElDial para aparentar que NotariaOS ha sido probado.

## 5. Definición de terminado

- Historia demostrable por el rol previsto, con casos negativos y estados alternativos relevantes.
- Validaciones equivalentes en UI y servidor, con fuente de verdad en servidor.
- Auditoría y tratamiento de fallos incluidos; documentación/ADR al día.
- Sin datos/identidades de referencia incorporados accidentalmente; sin secretos o logs sensibles.
- Evidencia real y límites explícitos, sin simulación oculta.
- Revisiones de negocio/jurídicas exigibles completadas antes de habilitar su operación real.

## 6. Estimación y presupuesto

La fase 1 permite medir el costo de extracción de componentes y cerrar las historias visuales. Antes de fase 2 se asignarán jornadas por historia con equipo/disponibilidad conocidos. Las historias L pueden dividirse por caso de uso al concretar el piloto.

Presupuesto de operación: costos fijos de aplicación/BD/documentos/trabajos/respaldo/monitoreo + unidades facturables de proveedores + soporte + impuestos. Regiones, límites y retención documentados. Revisar hardware, licencias, certificados y egreso de datos por separado.

No hay proveedores contratados, tarifas actuales comprobadas ni presupuesto cerrado en esta fase. Las cotizaciones deben provenir de fuente oficial/canal comercial, con fecha, unidad de cobro, mínimos y condiciones.

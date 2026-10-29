# Fase 3 · Expediente y procedimiento local integrado

**Entrega vigente: 0.5.0 · BK-13 a BK-17 y presupuesto BK-33 · 29/10/2026.** Por confirmación de André, BK-15, BK-16 y BK-17 se entregan juntos. Se vuelve al orden de fases enteras; las etiquetas 4.1–4.3 quedan como antecedentes, no se crean más subfases. La versión del paquete no es el número de fase.

El bloque local de fase 3 comprende expedientes persistentes, requisitos, documentos y revisión, plantillas jurídicas, presupuesto, identificación simulada, comparecencia/otorgamientos de prueba, registro y folios internos concurrentes, certificación, diligencias de cartas y entrega. Conserva autenticación, archivos privados, permisos, auditoría, ELDIAL negro/azul, Montserrat, móvil y oscuro. La política es de ejercicio; no se habilita una notaría para operar por completar este software local.

| Historia | Resultado local | Límite antes de operar |
| --- | --- | --- |
| BK-13 | Expedientes, intervinientes, instantáneas, requisitos y tareas persistentes | Catálogo y política de requisitos aprobados |
| BK-14 | Plantillas/versiones, variables, generación y revisión separada | Catálogo vacío; textos propios revisados, formato jurídico final |
| BK-15 | Cuatro resultados de identidad, consulta de desconocidos y excepción individual del Notario con sustento | Sin RENIEC/lector/biometría; admisibilidad legal de excepciones pendiente |
| BK-16 | Comparecencia sobre versión/identidad/contexto, registro Notario, secuencia y folios SIM, incidencias sin reutilizar números | Sin firma, protocolo ni autorización notarial real; poderes/capacidad e intervinientes aplicables revisados por profesionales |
| BK-17 | Certificación local diferenciada de escritura; cartas con programación, intentos, aclaraciones, constancia y entrega independiente | Sin diligencia física, traslado, presentación externa ni documento legal de salida |
| BK-33 | Presupuesto versionado, aceptación y orden administrativa | Separado de caja, instrumento y autorización |

## Recorrido integrado

1. En un expediente, completar requisitos y crear borrador o generarlo desde una plantilla propia revisada. Abogado/Notario registra revisión profesional de esa versión y contexto.
2. En **Identificación**, seleccionar cada interviniente y escenario explícito. Desconocido exige consulta. No coincidencia y error técnico siguen bloqueando; solo Notario puede evaluar excepción local con fundamento y sustento liberado de esa persona.
3. En **Actuación**, registrar comparecencia/conformidad de cada interviniente con evidencia privada liberada. El nombre de la acción cambia según compraventa, certificación o carta. Una nueva versión o contexto exige renovar sus controles.
4. Notario registra instrumento local con cantidad de folios de prueba. El servidor asigna número SIM y rango, después de comprobar todos los controles. Reintentos no duplican número. Las instantáneas quedan congeladas.
5. En carta, abrir **Diligencia y entrega**, programar destinatario/dirección/fecha/responsable, registrar resultado y sustento de cada intento. Puede haber varios intentos. Un desconocido se aclara sin editarlo. Notario cierra constancia con resultados conocidos, incluso si no hubo entrega al destinatario.
6. Registrar entrega al solicitante de la instantánea autorizada, con evidencia de esa persona. En carta exige constancia previa. Consultar/descargar constancia interna `.txt` privada, auditada y marcada sin validez notarial. Esto no ejecuta envíos ni firma.
7. Corregir un registro mediante **Registrar incidencia** del Notario. El anterior permanece con número/folios; un registro nuevo requiere controles vigentes y otro número. No se reescribe historia al cambiar la ficha, plantilla o documento.

Administración/Recepción/Abogado/Notario consultan y registran evidencia. Solo Notario exceptúa, registra instrumento, deja sin efecto o cierra constancia. Caja conserva exclusión jurídica. Mutaciones con TOTP, sesión reciente y origen validado. Política conservadora: todos los participantes agregados requieren identificación/conformidad; no se infiere exención por rol. Revisar aplicabilidad operativa con la notaría.

Migración 009 aditiva; ledger inmutable, solicitudes idempotentes y contador reconstruible. Bloqueo expediente → contador; evento/número/folios/revisión/actividad/auditoría/solicitud en la misma transacción. El procedimiento no cambia dinero, presupuesto, tarifas ni fiscal. **SUNAT real sigue deshabilitado**, sin proveedor ni selector productivo.

## Verificación y continuidad

Suite integrada `playwright.procedure.config.ts`, base QA nueva `.notaria-procedure-qa-*`, nunca `.notaria/`. Los servidores se detienen y se comprueba el propietario real de Windows antes de abrir PGlite para scripts, respaldo o restauración. Comandos: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` para regresión completa y `npm run test:procedure` para el bloque instrumental en QA nueva. Integridad cerrada con `npx tsx scripts/verify-procedure-integrity.ts <QA>`, copia/restauración local y `compare-procedure-restoration.ts <QA> <restaurada>`.

Decisiones: [ADR 0008](../adr/0008-procedimiento-instrumental-local.md). Resultados ejecutados y límites: [evidencia de procedimiento](../evidence/fase-3-procedimiento.md). Se conserva el núcleo económico local de fase 4 (incluido tarifario y fiscal simulado). El siguiente bloque original es **fase 5 · cumplimiento**; fase 6 queda condicionada a convenios, revisión y autorización para integraciones reales. PostgreSQL de servicio, recuperación de contraseña, antivirus, políticas jurídicas/tributarias, seguridad externa y piloto siguen pendientes donde corresponde.

---

## Antecedente de la primera entrega parcial de fase 3

# Fase 3 — Expedientes, requisitos, versiones y presupuestos

29/10/2026 · NotariaOS 0.3.0 · Entrega local para revisión.

## Recorrido para probar

Abrir [expedientes](http://127.0.0.1:3100/expedientes). Se conserva el acceso con TOTP de fase 2 y la estética negra y azul de ELDIAL/Clix. Si aún no configuraste la instalación, empieza en [acceso](http://127.0.0.1:3100/acceso), crea tu administrador y verifica el autenticador. Las cuentas QA no se incorporan a la revisión.

1. En **Personas**, registra fichas ficticias. En **Expedientes → Nuevo expediente**, selecciona solicitante, acto y asunto. Se asigna una referencia interna desde el servidor. La ficha aparece al recargar, en la búsqueda y en el inicio.
2. En **Intervinientes**, incorpora otras fichas indicando su calidad. Cada incorporación guarda una instantánea; editar luego la ficha general no cambia el expediente ni sus borradores anteriores.
3. En **Requisitos**, registra la revisión, observación y, si corresponde, una versión de sustento liberada en Archivo privado. Puedes agregar requisitos específicos. La lista inicial es orientativa, no un catálogo jurídico aprobado.
4. En **Documento**, redacta y guarda una versión. Consulta las anteriores con el selector. Cada versión conserva texto, contexto y huella. Para registrar revisión profesional usa una cuenta con perfil **Abogado o Notario**, creada desde Configuración y con su propio TOTP. Cambiar requisitos/intervinientes o guardar otro borrador deja pendiente una nueva revisión.
5. En **Presupuesto**, registra conceptos, cantidades, importes en soles y vigencia. Distingue honorarios, terceros y otros conceptos. Guarda la versión y registra la aceptación comunicada por un interviniente con referencia de su sustento. Se crea la orden administrativa del expediente.
6. Crea otra versión de presupuesto. La propuesta aceptada anterior se conserva y su orden permanece vigente hasta aceptar una nueva versión. Aceptar no genera cobros, facturas ni actuación notarial.
7. En **Resumen**, agrega tareas con fechas internas y observaciones. En **Actividad**, consulta quién realizó cada cambio. Los plazos internos no se calculan como vencimientos legales.

## Conflictos y versiones

Dos personas no pueden sobrescribir silenciosamente la misma revisión. El segundo cambio recibe un conflicto. En un formulario abierto, **Actualizar contexto sin cerrar** conserva el texto introducido; revisa el nuevo contexto antes de guardar otra versión.

Los borradores y presupuestos anteriores no se editan. Las aceptaciones permanecen vinculadas a la propuesta exacta. Las instantáneas, versiones, revisiones y actividad tienen protección adicional en la BD frente a UPDATE/DELETE; un administrador de BD sigue siendo una autoridad privilegiada.

## Interfaz y datos

El inicio, la búsqueda global, la lista/tablero y el contador de expedientes consultan datos persistentes autorizados. Hay búsqueda por kardex, asunto e interviniente, filtro por acto y paginación en servidor. El tablero representa la página actual.

La aplicación deja de cargar expedientes ficticios predeterminados en las rutas principales. Los archivos del antiguo prototipo permanecen como antecedentes de código/pruebas. Caja, agenda avanzada y módulos de actuación muestran su estado pendiente en lugar de mezclar registros en memoria con los expedientes persistentes.

Los datos ya creados en fase 2 se conservan mediante migración aditiva. No se modificó la referencia ElDial. Antes de la actualización local se generó una copia privada con el servidor detenido.

## Trazabilidad del plan

| Historia | Entrega de este corte | Trabajo posterior |
| --- | --- | --- |
| BK-13 | Expedientes por acto, participantes, requisitos/catalogación versionada, tareas y observaciones | Catálogos/procedimientos de la notaría por validar |
| BK-14 | Borradores inmutables, revisión exacta, instantáneas y concurrencia | Plantillas con variables y generación de instrumentos |
| BK-33 | Presupuestos por conceptos, vigencia, versiones, aceptación y orden administrativa | Tarifario, cargos, tratamiento tributario y efectos financieros de fase 4 |
| BK-15–17 | Dependencias preservadas en el plan | Identificación, otorgamientos, registros instrumentales, diligencia y entrega persistentes |

La comparación Adiasoft/Eureka se materializa aquí en el presupuesto versionado conectado al expediente. Gastos, fondos de terceros, proveedores y cuenta consolidada siguen incluidos en fase 4 (BK-34–36). Ninguna declaración comercial de esos proveedores se toma como validación de compatibilidad legal/fiscal.

## Operación local y verificación

`npm run build`, `npm start`; misma dirección local y directorio privado `.notaria/` de fase 2. No abrir dos procesos sobre la misma base. La copia/restauración incluye ahora también las nuevas tablas, conservando el procedimiento de [fase 2](../phase-2/ENTREGA.md).

Ver [ADR 0003](../adr/0003-expedientes-y-presupuestos-versionados.md) y [evidencia de fase 3](../evidence/fase-3.md). El presupuesto usa cantidades exactas y no liquida impuestos ni mueve caja. El borrador es texto de trabajo sin firma ni validez notarial. No hay conexión real con RENIEC, SUNAT, SUNARP o firma.

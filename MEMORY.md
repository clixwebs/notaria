# Estado vigente · Autocompletado DNI autorizado

29/10/2026. El usuario pidió consulta automática al registrar persona y autorizó explícitamente reutilizar **soloAPIPERU_TOKEN deElDial**. Referencia leída solo para código/esa variable, sin otros secretos,bases/clientes o cambios. Se conectaapiperu.dev porPOSTcontrato actual para completar nombres/apellidos. Token cifradoVercel producción, servidor únicamente. No esRENIEC ni acredita identidad; no dirección/biometría/capacidad. GateRENIEC notarial/SUNARP/fiscal reales permanecenfalse. ADR0013/evidencia`person-lookup.md`.

Alta de persona porDNI8dígitos autocompleta tras700ms; tipoDEMO/CE/PASAPORTE manual, edición existente sinconsulta automática. Guardado explícito. EndpointprivadoPOSTpeople/lookup con origen/sesión/TOTP/people:write;Caja403. Auditoría de intentos/resultados sin DNI/nombres,presupuesto durable10/min/usuario con lockfila,hostfijo,tokenservidor,timeout8s,sinredirect,16KiB y coincidenciaDNI. Protección ante respuestas atrasadas y escritura manual; fallback/reintento. Sin migración,semillas o efectos financieros/jurídicos.

57unitarias y7E2E/API correctos,build/TypeScript/lint correctos. QA-01 yQA-02 nuevas separadas,segunda móvil390px;mock preimportado exclusivamente en procesoQA. Proveedorreal respondió al ejemplo público (622ms),sin guardar datosconsultados ni crear personas en producción. Leer evidencia para distinguir mockQA de conexiónreal. Nueva guía enADR/evidencia;historias anteriores de integraciones sinconexión se mantienen como antecedentes salvo este autocomplete autorizado.

---

# Antecedente · Demostración publicada con datos ficticios

29/10/2026. Después del despliegue, el usuario autorizó expresamente llenar la base publicada con datos simulados para mostrarla al cliente. `https://notariaos.vercel.app` pasa a ser entorno de DEMOSTRACIÓN persistente:12personas tipoDEMO,9expedientes,9presupuestos/7aceptaciones,6tarifas,4TXT privados(3liberados/1cuarentena),16movimientos y2documentos fiscalesSIM preparados. Caja695.00; deuda2390.00; anticipos100.00; terceros150.00; gastos pendientes0.00. Importes ficticios exactos/separados. No nuevas cuentas, roles profesionales, PLAFT, autorización notarial o integraciones reales. La cuenta administradora mantiene TOTP pendiente; contraseña inicial únicamente en `.env.access.local` ignorado, sin copiarla aquí. Guía `docs/deployment/ACCESO-Y-DEMO.md`.

ADR0012 autoriza este conjunto explícito enPostgreSQL; no autoriza semillas enruntime, memoria o `.notaria/`. `scripts/seed-demo.ts` exige objetivo/hostname/confirmación/administrador, rechaza mezcla con datos existentes y se ejecuta atómicamente con comandos de dominio/auditoría. Marcador `demo-client-20261029-v1` y lock evitan duplicación. Ensayo en ramaQA NUEVA `br-holy-union-b5oxu5qk` (`qa-demo-20261029`), independiente delQA anterior, con secretoauth independiente. Repetición sin duplicados y6grupos de comprobaciones correctos:conteos/saldos,DEMO/huellas/cuarentena,inmutabilidad,TOTP-QA/PLAFT,APIs,pantallasChrome sin errores. Primer intento de navegador pidió Chromium no instalado; corregido aChrome existente. Se conserva evidenciaQA y producción;TypeScript/lint correctos. El servicio local principal3100/PID24328 continúa usando `.notaria/`, sin acceso desde scripts ni cambios en su base.

Antes de usar datos operativos: base limpia independiente y transición validada; no eliminar historial inmutable para limpiar esta demostración. Las afirmaciones de producción vacía que siguen son historia del despliegue inicial, superadas por esta petición.

---

# Antecedente · Publicación autorizada

29/10/2026 · NotariaOS0.7.0. El usuario autorizó explícitamente publicar en su repositorio `https://github.com/clixwebs/notaria.git`, crear Neon y Vercel. Esa autorización supera el bloqueo de publicación anterior para este alojamiento, **no** para RENIEC/SUNARP/SUNAT/firma/ROS/notificaciones. Se crearon recursos nuevos sin tocar los otros proyectos.

URL canónica `https://notariaos.vercel.app/acceso`, Vercel equipoCLIX/proyecto`notariaos` (`prj_8WVYRrhn339FLBaaYWmxxRwFmMDz`), GitHubmain. Neon proyecto`frosty-truth-22823896`, PostgreSQL17/aws-us-east-2, producción`br-calm-water-b55d1nru`, QAseparada`br-mute-feather-b54xgffv`. No se migraron datos/clave de `.notaria/`; producción vacía salvo primera cuenta de Jose Gonzalez con el correo expresamente confirmado en chat. Contraseña aleatoria en archivo local `.env.access.local`, ignorado; no guardar credenciales en memoria/repositorio ni activar TOTP por el usuario.

Leer ADR0011 y `docs/deployment/VERCEL-NEON.md`. Vercel exigeDATABASE_URL/BETTER_AUTH_SECRET/NOTARIA_URL, sin fallbackPGlite ni escrituras locales. PostgreSQL no migra en peticiones: comando explícito `scripts/migrate-postgres.ts` conNOTARIA_MIGRATE=1, fuera deVercel. Migraciones1–11 aplicadas a ambasbases. Runtime`notaria_runtime` sin superusuario/CREATEDB/CREATEROLE/CREATEschema, permisosCRUD/secuencias explícitos. API Neon creaba roles conneon_superuser; se reemplazaron víaSQL y eliminaron los provisionales. Vercel almacena conexión limitada/secreto/URL cifrados; no las claves de gestión. Bootstrap web externo sigue bloqueado; `scripts/provision-admin.ts` solo desde terminal autorizada. Cuenta inicial conTOTP pendiente, loginreal y bloqueo de datos comprobados sin inscribir autenticador.

La regresión histórica local83/52 y evidenciasfase6 siguen conservadas. El intento completo Neon pasó16 y falló por timeoutUI5s mostrandoCargando;66no ejecutadas. No declararlo83verde enNeon. Configuración remota amplía esperas; prueba enfocada cubre rolrestringido/TOTP/permisos/reserva/concurrencia/dinero/bytes/rollback/UI/logout. Resultados finales en evidencia de despliegue. Archivos <4MB enVercel por límite del proveedor; no afirmar capacidadlocal5MB como capacidadcloud. Alojamiento de revisión, no piloto/homologación; integraciones reales siguen bloqueadas.

---

# Antecedente local conservado

# Estado vigente de NotariaOS

Actualizado:29/10/2026 · America/Lima · **0.7.0** · Fase6, alcance local integrado entregado. **Fase real sin cerrar**.

André pidió fase6 COMPLETA según plan, sin subfases, comprobar dependencias y ejecutar todo lo local autorizado. Se revisaron plan/backlogs/entrega/ADR/evidencia5 y código/Windows. El plan requiere BK-24 spike lector/canal y adaptación real autorizada; BK-25 firma/traslado/cargo/seguimiento; BK-26 demo fiscal real. Convenios, equipo, certificado/validador, SID/proveedor/cuenta y autorización no están acreditados. La entrega local no sustituye esas pruebas. Leer `docs/phase-6/ENTREGA.md`, `DEPENDENCIAS.md`, ADR0010 y `docs/evidence/fase-6.md`. No crear6.1/6.2 ni afirmar fase real completa.

Una sola notaría; ELDIAL es ERP retail/referencia Clix. Login/Montserrat/barra compacta/negro#0D1728-azul#174EA6/oscuro/móvil conservados. Sin nuevas dependencias ni acceso a App prueba/secretos/bases de clientes. Sin publicación/proveedor/envíos. RTK.md referenciado no encontrado en proyecto/padres y ubicaciones de instrucciones revisadas; no se inventaron sus reglas.

## Implementación local de fase6

Migración011 aditiva, `integration_records/events/requests/artifacts` append-only y `integration_state` reconstruible por oficina/canal. `/integraciones/reniec`, `/integraciones/sunarp`, `/integraciones/fiscal`, API `/api/integrations`; integration-domain/integration-adapters/integrations/integration-pages. Tres bloqueos reales fijos; sin transporte/endpoints/secretos/toggle. Evaluación versionada de dependencias/responsable declarado no activa acceso.

BK-24: spike local del contrato con cuatro resultados, desconocido separado, hardware NO probado y cero biometría. Describe situación de lector/equipo sin detectarlo ni cambiar identidad del expediente. Adaptador de identidad fijo simulation conservado.

BK-25: manifiesto interno exacto del instrumentoSIM activo/borrador histórico; sin firma, formato notarial o presentación. Firma simulada favorable/inválida/revocada/indisponible, siempre cryptographicallyVerified=false. Última favorable de esa huella permite cargo simulado único. Archivo externo privado liberado permite seguimiento separado: Notario declara informe/validador/fecha/resultado con versión privada del informe, luego cargo con versión privada y fecha/referencia. **Declarado,no verificado**, nunca firma/presentación auténticas acreditadas. Descargar no presenta. Hash exacto, última evaluación vigente, cargo congela validación; seguimiento por evento exacto y fecha no retroactiva respecto a hito anterior. Nuevo archivo/corrección requiere nuevo registro. InstrumentoSIM dejado sin efecto bloquea nuevas constancias/cargos. No OCSP/CRL/TSA ni automatizaciónSID.

BK-26: evidencia de demo externa DECLARADA paraUUID/huella deXML SIM. Resultado declarado noCDR y sin cambios en proyección fiscal, dinero, series o caja. No se ejecutó demo real. Simulador fiscal anterior conserva timeout/consulta/idempotencia. SUNAT real y formato oficialSBS/OCP deshabilitados.

Canales identidad/traslado usan permiso de procedimiento; Caja sin contenido/recuentos/descargas. Fiscal Administración/Caja, Notario sin acceso. Evaluaciones Administración/Notario según canal; firma/informe/cargo soloNotario, sin presumir habilitación real. Sesión/TOTP/origen/recencia en servidor, oficina, lecturas/descargas auditadas. PLAFT no consultado/replicado. Caso→canal como orden de lock, UUID/hash/actor/oficina y revisión, cadenaSHA256, auditoría atómica. Sin escrituras a módulos previos.

## Verificación y servicios al cierre

**52 unitarias y83E2E/API correctas**,0 fallos/omitidas/reintentos en pasada final de184573.515ms; build/TypeScript/lint correctos.74 regresiones+9 escenarios nuevos.15grupos integridad original/restaurada;51tablas iguales, archivos/bytes y clave igual sin divulgarla. Capturas1440/683/390 ymodaloscuro, axe/reflujo/teclado; noWCAG integral. Ver evidencia para intentos iniciales conservados (2 de red/sandbox y1 de aserción del catálogo de archivos; no ocultarlos).

QA final `.notaria-phase6-qa-03`, restaurada `.notaria-phase6-restaurada-qa-03`, detenidas.9registros/17eventos-solicitudes/2manifiestos. BackupQA `backups/local-2026-10-29T13-48-22-195Z`. Suite `playwright.phase6.config.ts`/`phase6.spec.ts`, siempreQA nueva en3101. Verificadores guardan comprobación Windows antes de abrirQA; destructivas solo copia en memoria. Comparación secuencial. No ejecutar dos procesos porPGlite.

PrincipalWindows13544 se detuvo antes del respaldo cerrado `backups/local-2026-10-29T13-35-19-713Z`. Reabierta0.7.0 en3100, sesión63919, **Windows25260**, `.notaria/`. Login200/APIs y manifiestos401/páginas→acceso, sin errores. No se crearon cuentas/expedientes/archivosQA en principal. QA01/02/03 y restaurada detenidas, solo3100 escucha. **No abrir principal desde scripts mientras siga activo.**

Cierre real de fase6 depende de `DEPENDENCIAS.md` y autorización explícita; no pedirlos para completar trabajo local ya ejecutado. Antes de operación: revisión jurídica/tributaria, responsables/políticas y anexosSBS, seguridad/gestión privilegiada, antivirus/cifrado, PostgreSQLgestionado, recuperación/carga/RPO/RTO, capacitación/piloto. Fase7 es ampliación independiente; no inferir autorización para portal/notificaciones por esta entrega.

---

# Antecedente conservado · Fase5 completa local0.6.0

# Estado vigente de NotariaOS

Actualizado:29/10/2026 · America/Lima · **0.6.0** · Fase5 completa local.

## Pedido actual y alcance entregado

André pidió **fase5 completa según plan, sin subfases**, conservar ELDIAL, QA separada, memoria/decisiones/evidencia y SUNAT real deshabilitado. Se implementan **BK-21, BK-22 y BK-23 juntos**. No crear entregas5.1/5.2 ni pedir continuar historia por historia. El alcance local y las dependencias operativas se distinguen en `docs/phase-5/ENTREGA.md`, ADR0009 y `docs/evidence/fase-5.md`. La versión técnica0.6.0 no es la fase6.

Una sola notaría; ELDIAL es ERP retail de referencia, no cliente. Sin acceso a App prueba ni nuevos paquetes, proveedores, publicación, ROS automático o notificaciones externas. Negro#0D1728/azul#174EA6, Montserrat/loginClix/navegación superior y oscuro/móvil conservados.

## Implementación de fase5

Migración010 aditiva, cuatro tablas append-only (`compliance_records`, `compliance_events`, `compliance_requests`, `compliance_artifacts`) y revisión reconstruible `compliance_state` por oficina/área. `/api/compliance`, `/cumplimiento/plaft`, `/cumplimiento/privacidad`; `compliance-domain.ts`, `compliance.ts`, `compliance-schema.ts`, `compliance-pages.tsx`.

PLAFT solo perfil Notario custodio de ejercicio; no se infiere designación OCP real. Administración/Recepción/Abogado/Caja sin contenido/recuentos/descargas. Privacidad Administración/Notario; publicar política o levantar bloqueo solo Notario. Permisos/origen/TOTP/sesión reciente en servidor, denegaciones/lecturas/descargas auditadas. No copiar señales o identificadores reservados a actividad de casos, documentos generales o auditoría general. No hay nueva delegación administrativa implícita; administración privilegiada/credenciales/BD requieren revisión antes del piloto.

Diligencia por expediente/persona participante, fecha operación, importePEN exacto, PEP declarado, beneficiario/verificación, origen, señales, riesgo y próxima revisión. Instantáneas conservadas; revisión humana seguimiento/cerrado/escalar. No ROS, listas externas o autorizar acto automáticamente por evaluación.

Finalidades por código/versiones, base/aviso/consentimiento/fuente/conservación/calendarioARCO/feriados; catálogo vacío. Avisos y tratamientos congelan política. Retiro de consentimiento por finalidad, sin borrar historia. ARCO registra recepción/alcance/plazo con calendario congelado, identidad/representación antes de responder, ampliación única comunicada salvo información y respuesta/evidencia/entrega. Subsanación/suspensión operativa exige procedimiento aprobado; no se finge motor normativo exhaustivo.

Conservación por persona/categoría/expediente opcional. Fecha solo de revisión; bloqueo no vence automáticamente. Notario levanta con fundamento. Cancelación totalmente atendida bloqueada mientras haya conservación activa; respuesta parcial/denegatoria posible y fundada. No API de borrado, supresión física ni eliminación de instrumentos/auditoría. Sustentos son texto reservado/referencias declaradas; no se suben adjuntos sensibles al archivo general.

Incidentes: conocimiento original, evaluaciones ANPD/titular/CNSD separadas con fundamento y estado aplica/no-aplica/pendiente. Hito ANPD/CNSD coincide con conocimiento; titular puede tener otro hito evaluado. Primera evaluación fija reloj; revisiones no lo reinician.48h orientativas desde hito al aplicar, no desde creación. No aplicación guarda motivo. Constancia externa por destinatario, sin enviar desde ERP. Cierre exige evaluación definida y constancia de última evaluación aplicable. Política de notaría y supuestos jurídicos antes de uso real.

Exportación `notariaos-ro-review-v1`: JSON interno canónico de operaciones seleccionadas/revisadas del periodo, origen/historial/revisión/huellas congelados. Contrato/cadenas/duplicados/periodo/decimal validados. Nueva preparación creaUUID/artefacto nuevos; revisión posterior conserva archivo anterior. Descarga privada auditada,no-store. Cargo externo declarado paraUUID/huella, no verificado; no equivale a aceptación. **Formato oficial SBS/OCP deshabilitado** hasta anexos consolidados2026, calendario/régimen/responsabilidades y homologación. Plan fase5 exige formatos pendientes deshabilitados. SUNAT real deshabilitado, sin toggle ni canal.

Lock oficina/área, UUID/hash/actor/oficina y revisión. Reintento confirmado devuelve respuesta antes de validar revisión; otros datos/actor rechazan. Registro/evento/artefacto/revisión/solicitud/auditoría atómicos. CadenaSHA256 y triggers no sustituyen firma ni anclaje independiente. Ninguna actuación de cumplimiento cambia deuda, anticipos, fondos de terceros, tarifas, fiscal, plantillas, borradores o procedimiento.

## Verificación y servicios

Validación final: **47 unitarias y74 E2E/API correctas**,0 fallos/omitidas/reintentos,181027.708ms. Build/TypeScript/lint correctos.13 grupos de integridad en original/restaurada;46 tablas exactamente iguales incluyendo bytes privados y clave local sin divulgar. QA final `.notaria-phase5-qa-03`, restaurada `.notaria-phase5-restaurada-qa-03`, ambas detenidas; copiaQA `backups/local-2026-10-29T13-18-08-779Z`. Intentos01/02 conservados con71 correctas/1 fallo de aserción/2 omitidas cada uno; no ocultarlos ni confundirlos con final toda correcta.

Suite vigente `playwright.phase5.config.ts`/`phase5.spec.ts`, regresiones previas más cumplimiento. Leer evidencia final para resultados ejecutados y QA de cierre. Pruebas destructivas solo en copia QA en memoria; comprobar propietario Windows antes de abrir PGlite. Nunca dos procesos por carpeta. No se crearon cuentasQA en principal.

Principal cerrada/respaldada antes de migrar: `backups/local-2026-10-29T12-59-55-273Z`. Versión0.6.0 ya reabierta en3100, sesión herramienta95492, Windows13544, `.notaria/`. Revisión anónima de áreas/archivo de cumplimiento y APIs previas401, páginas protegidas→acceso, login200 y sin errores. QA-01/02/03 y restaurada detenidas; solo3100 principal activo.

Siguiente fase original6: convenios/canales/dispositivos/certificados/proveedor/autorización antes de integración real. No interpretar la entrega local de cumplimiento como habilitación operativa. Pendientes transversales: políticas/responsables/revisión jurídica y tributaria, anexos oficiales, seguridad externa, gestión privilegiada, archivo/retención operativa, antivirus/cifrado gestionados, PostgreSQL gestionado, recuperación/carga/RPO/RTO y capacitación/piloto.

---

# Antecedente conservado · Fase3 integrada0.5.0

# Estado de NotariaOS

Actualizado: 29/10/2026 · America/Lima · **0.5.0**.

## Pedido y estado vigente · Fase 3 integrada

André pidió BK-15 y confirmó incluir **BK-15, BK-16 y BK-17 juntos**, volviendo a fases completas porque las entregas decimales tomaban demasiado tiempo. Se completa el bloque local de fase 3 junto a BK-13/14 y presupuesto BK-33. No crear más fases 4.4/4.5 ni pedir continuar historia por historia. Las entregas 4.1–4.3 son antecedentes conservados; versión técnica 0.5.0 no significa fase 5. La fase 4 económica local ya está implementada. Siguiente bloque original: fase 5 · cumplimiento, seguido de integraciones reales de fase 6 condicionadas a autorización/convenios. No declara operación notarial habilitada.

Leer `docs/phase-3/ENTREGA.md`, `docs/adr/0008-procedimiento-instrumental-local.md` y `docs/evidence/fase-3-procedimiento.md`. Una sola notaría peruana; ELDIAL es retail de referencia, no cliente. Montserrat, login Clix/ELDIAL, barra superior, negro #0D1728/azul #174EA6, oscuro y móvil conservados. Sin nuevas dependencias, sin acceso a App prueba, sin publicación/proveedores reales. SUNAT real sigue deshabilitado y no tiene toggle productivo.

## Implementación BK-15–17

Migración009 aditiva. `src/lib/procedure-domain.ts`, `src/server/procedures.ts`, `procedure-schema.ts`, `identity-adapter.ts`, `/api/procedures/[caseId]` y `src/components/procedure-panel.tsx`. Pestañas de expediente Identificación, Actuación, Diligencia y entrega. Dos historias append-only (`procedure_events`, `procedure_requests`), `instrument_counters` reconstruible e índice único parcial de número por oficina.

Identidad fija `simulation`, escenarios explícitos coincide/no-coincide/error-tecnico/desconocido. Se vincula a participación, instantánea y borrador; no se traslada a otra versión. Desconocido exige consulta antes de otro intento o excepción. Notario solo exceptúa contingencia conocida, con fundamento, aceptación y archivo privado liberado de esa persona; no es excepción legal operativa. Administración/Recepción/Abogado/Notario consulta/captura; Caja excluida. Decisiones reservadas solo Notario; TOTP/origen/sesión reciente en mutaciones.

Comparecencia/conformidad conserva versión/huella, identidad exacta, contexto y evidencia individual. Diferenciada por compraventa/certificación/carta. Todos los participantes agregados requeridos en política `procedimiento-local-v1`; no se infiere capacidad ni exención por rol/tipo de persona. Registro solo Notario después de revisión profesional vigente, requisitos completos e identidad/conformidad de todos. Número `SIM-ESCR/CERT/CARTA` por oficina/año Lima/acto y folios internos consecutivos; jamás oficiales. Un instrumento activo por caso. Incidencia append-only sin reciclar números/folios; documento nuevo y ficha actualizada no reescriben historia.

Carta: programación con destinatario/dirección/fecha/responsable de oficina; resultado y sustento por intento, varios intentos; desconocido se aclara por evento adicional, no se presume entrega. Notario cierra constancia con todos los resultados conocidos; rechazo/no encontrado/error no se convierten en entrega. Entrega al solicitante separada, destinatario de instantánea autorizada y evidencia propia, una por instrumento con reintento idempotente. Constancia `.txt` privada/auditada, legible y marcada sin firma/validez notarial. No DOCX/PDF/firma/protocolo real, diligencia física, presentación registral o envío externo.

Bloqueo expediente → contador; registro/número/folios/revisión global/actividad/auditoría/UUID se confirman juntos. UUID/hash/actor/oficina/caso para repetir respuesta confirmada sin duplicar; payload/actor distinto rechaza. Cambios de contenido exigen revisión/conformidad nuevas, nueva identidad exige otra conformidad. Fallo de auditoría revierte todo. Sustentos de UI consultados en servidor por expediente/intervinientes, no por ficha viva ni listado global limitado. Procedimiento no toca saldos, dinero exacto, anticipos, terceros, fiscal, tarifas o plantillas.

## Verificación ejecutada y límites

Build/TypeScript/lint finales correctos; **41 unitarias** correctas. Regresión integrada QA-03:54 escenarios anteriores correctos y8 nuevos correctos antes del ajuste de teclado de constancia. JSON completo conserva62 correctos/1 fallo de axe/1 omitido; no decir que ese pase fue todo verde. Corregido `scrollable-region-focusable`; suite enfocada nueva QA-04 pasó10; tras presentar texto legible en lugar de JSON, final **QA-05 pasó10/10** (9 recorridos del bloque + revocación),0 fallos/omitidos/reintentos,12.940 s. Conjunto:54 regresiones y10 escenarios finales verificados. Suite completa `playwright.procedure.config.ts`, enfocada `playwright.procedure-focused.config.ts`; scripts `test:e2e`/`test:procedure`, siempre QA nueva. No repetir regresiones ajenas por ajustes reversibles de presentación después de verificación enfocada correcta.

Axe/reflujo/teclado en1440/683/390 y diálogo oscuro, capturas inspeccionadas; no conformidad WCAG completa.14 grupos de integridad en original y restaurada: inmutabilidad/huellas/alteración/índice único/rangos/aislamiento/reinicio/idempotencia/rollback total/audit y ausencia de efectos laterales. Alteración y registros extra solo en copia en memoria. Comparación CLI de **41 tablas** iguales, incluyendo documentos privados/bytes y clave local sin exponerla. Auditoría excluida porque verificadores registran lecturas.

QA integrada `.notaria-procedure-qa-03` y restaurada `.notaria-procedure-restaurada-qa-03`, detenidas.34 eventos/solicitudes,3 contadores,29 expedientes/participantes,14 borradores,10 revisiones. Finanzas38 entradas/47 solicitudes/3 sesiones/2 cierres; fiscal simulado9 documentos/24 eventos. BackupQA `backups/local-2026-10-29T12-32-04-044Z`. QA final enfocada `.notaria-procedure-qa-05`, detenida; QA-01/02/04 también detenidas.

Principal `.notaria/`: respaldo cerrado previo `backups/local-2026-10-29T12-09-46-193Z`, después de identificar/detener Windows23128. Revisión final0.5.0 en `http://127.0.0.1:3100/expedientes`, sesión herramienta59943, proceso Windows16688, sin altas/casos QA. Acceso200, APIs401 anónimas, página→acceso, sin errores. **Nunca abrir esa base desde script mientras el servicio siga activo.** Comprobar Windows real porque el sandbox puede ocultar puertos/procesos. Nunca dos procesos en una carpeta PGlite. Evidencia final y manifiesto de114 fuentes SHA-256 en docs/evidence;228 enlaces locales verificados,0 rotos.

Persisten validación jurídica/tributaria y catálogos propios, política de identidad/excepciones/representación/habilitación, PostgreSQL de servicio, recuperación de contraseña, antivirus, seguridad/operación/piloto e integraciones reales según plan. Identidad/certificación/otorgamiento local no constituye acto real ni firma. El siguiente desarrollo debe agrupar la fase 5 completa, manteniendo estos límites.

---

## Historial previo · 0.4.3 y anteriores (superado por el estado vigente)

# Estado de NotariaOS

Actualizado: 29/10/2026 · America/Lima · **0.4.3**.

## Pedido y alcance vigente

André autorizó **BK-14: plantillas jurídicas**, conservando lo funcional, ELDIAL, QA separada y emisión real SUNAT deshabilitada. **Completado el motor local en 0.4.3**. Leer `docs/phase-4-3/ENTREGA.md`, ADR0007 y `docs/evidence/fase-4-3.md`. Catálogo vacío: los textos propios de la notaría requieren revisión jurídica antes de uso operativo. Se conservan núcleo2–4, tarifario4.1 y fiscal simulado4.2; BK-15–17 y BK-26 real permanecen pendientes.

Una sola notaría peruana. ELDIAL es ERP retail de referencia, no la notaría cliente. Conservar familia Clix/ELDIAL, mismo acceso, Montserrat, negro tinta #0D1728, azul #174EA6, barra superior compacta, móvil y oscuro. Sin rojo/dorado ni sidebar de escritorio nuevos. No conectar proveedores ni publicar sin autorización. Referencias `C:/Users/ANDRE/Desktop/App prueba`: solo lectura, sin scripts/secretos/respaldos/bases de clientes. En este corte no se accedió a esas referencias.

## Corte 4.3 implementado · BK-14

Migración008 aditiva. `/plantillas` en Más/móvil y `/api/templates` con catálogo/versiones; `/preview` y `/generate`. Código en `src/lib/template-domain.ts`, `src/server/templates.ts`, `template-schema.ts`, `src/components/template-pages.tsx`, integrado al Documento persistente del expediente. Sin nuevas dependencias ni acceso a App prueba.

Abogado/Notario publica una versión con constancia explícita de revisión del texto base, motivo, TOTP y sesión reciente15 min. Administración/Recepción lee/genera sin adquirir revisión profesional; Caja excluida. No hay doble aprobador obligatorio ni biblioteca de cláusulas aprobadas. Catálogo por oficina vacío. Publicar/retirar/reactivar crea historia inmutable y no cambia documentos ya generados.

Motor `plain-v1`, texto plano y sustitución literal en una pasada. Variables obligatorias texto/fecha/PEN exacto/entero/interviniente; claves únicas, usadas y sin extras. Fecha ISO se presenta DD/MM/AAAA, PEN cadenas/BigInt dos decimales, entero no negativo9 dígitos, interviniente elegido por UUID dentro del expediente y su instantánea. Reservadas referencia/acto/asunto del expediente. Sin fórmulas, condicionales, repetidores, eval, HTML activo, macros, IA, red ni importación de archivos. No infiere comparecientes ni identidad/capacidad verificadas.

Vista previa en servidor sin crear versión. Cambio de valores/selección/revisión invalida vista previa; diálogo conserva valores al actualizar contexto. Generación vuelve a comprobar acto, oficina y última publicación disponible bajo bloqueo expediente→catálogo. Agrega `case_drafts` y `case_draft_templates` con plantilla exacta, valores normalizados, sustituciones, contexto y huellas. Revisión global/contenido aumentan; el documento nuevo exige revisión propia. Editar manualmente después crea una versión manual rotulada y conserva el documento generado original, sin heredar automáticamente procedencia/revisión.

`legal_templates`, `legal_template_versions`, `template_requests`, `case_draft_templates` append-only; `template_state` reconstruible. UUID/huella/actor/oficina/tipo y revisión/versiones para reintentos/conflictos. Auditoría transaccional: falla y revierte publicación/documento/vínculo/revisiones/evento/solicitud. Caja, tarifas y fiscal no cambian por generación.

Build, TypeScript y lint correctos;37 unitarias y55 E2E/API correctas,0 fallos/omitidas/reintentos,105.997 s. Suite vigente `playwright.phase43.config.ts`/`phase43.spec.ts`, nueve escenarios nuevos y46 de regresión. QA-01 pasó54 antes de añadir actualización de contexto; finalQA-02 pasó55. Sin errores de página; axe/reflujo/teclado en plantillas1440/683/390 y diálogo oscuro, capturas inspeccionadas. No acredita conformidad WCAG completa ni contenido jurídico.

Once grupos de integridad BK-14 y regresión12 fiscales/7 tarifarios/12 financieros correctos en original/restauración. Generación reconstruida del origen congelado; falla de auditoría revierte todo; aislamiento por oficina/rol; copia reiniciada genera una sola versión al repetir solicitud sin cambiar finanzas/fiscal/tarifas. QA en disco conserva4 borradores generados,2 plantillas/7 publicaciones/11 solicitudes, sin altas de prueba en principal.

QA final `.notaria-phase43-qa-02` y restaurada `.notaria-phase43-restaurada-qa-02`, detenidas. Copia `backups/local-2026-10-29T11-22-19-197Z`;34 tablas exactamente iguales en comparación secuencial CLI. Datos financieros sintéticos:38 entradas/47 solicitudes,deuda907.21,anticipos5.20,terceros100.00,efectivo100.00; el motor jurídico no altera saldos. El verificador42 conserva su fixture único de recuperación fiscal solo en QA y resuelve en memoria.

Principal respaldada cerrada `backups/local-2026-10-29T11-06-36-379Z`, tras identificar/detener procesoWindows23300. Revisión0.4.3 activa `http://127.0.0.1:3100/plantillas`, sesión herramienta12152, base`.notaria/`. Comprobación anónima acceso200, APIs401 y página→acceso, sin cuentas/documentos QA añadidos. Comprobar propietarioWindows real antes de abrir PGlite; QA y principal siempre separadas. Histórico servicio4.2/sesión98903 queda superado.

No se implementan DOCX/PDF, formato enriquecido, autorización/firma/numeración instrumental, identidad o diligencia. Siguientes cortes BK-15–17 y validación operativa de textos de la notaría. BK-26 real sigue deshabilitado, sin proveedores ni toggle de emisión. ADR0007 documenta límites y decisiones.

## Antecedente 4.2 implementado · BK-19 de prueba

Migración **007** aditiva. `/fiscal` en Más → Fiscal · pruebas y menú móvil; `/api/fiscal`. `src/lib/fiscal-domain.ts`, `src/server/fiscal-xml.ts`, `fiscal-adapter.ts`, `fiscal-schema.ts`, `fiscal.ts`, `src/components/fiscal-pages.tsx`. Artefactos XML/PNG, instantánea y hashes congelados. Documentos/eventos/solicitudes/recibos simulados inmutables; proyecciones y series reconstruibles. Lock financiero antes del fiscal, revisión global/de documento y UUID/huella/actor/oficina. Un documento activo por cargo; series internas por oficina/tipo, nunca reutilizadas.

Origen: cargo propio de presupuesto aceptado no revertido. Solo conceptos propios; Terceros excluido. Receptor de prueba explícito con validación de formato, factura exige RUC11dígitos; no consulta identidad/RUC. Supuesto tributario explícito por línea (gravado18 incluido/exonerado/inafecto), sin inferirlo por categoría. Conserva precios finales y total exacto; ninguna operación fiscal toca deuda, cobros, anticipos/custodia o pagos. Consulta de identidad se marca como concepto separado, sin fijar su tratamiento real. Política de ejercicio: base gravada por línea = floor((bruto_céntimos*100+59)/118), impuesto diferencia; no convertir dinero a Number.

Contrato `notariaos-fiscal-sim-v1`: XML Invoice UBL2.1 con perfil/extensión/leyenda de simulación. RUC emisor ficticio00000000000, series SIM-F001/SIM-B001. QR real generado/decodificable comienza NOTARIAOS:SIMULACION:v1 e incluye importes/fecha/receptor/SHA-256 XML/SIN-FIRMA. El hash es integridad local, no DigestValue/firma. Sin certificado, CDR, URL/configuración de proveedor o modo productivo. No añadir toggle de producción.

FiscalAdapter de modo fijo simulation, sin red. `submit`/`consult` usan UUID estable del documento y huella; respuesta debe corresponder a ambos. Escenarios: aceptación, rechazo, proceso, timeout previo/posterior y fallo técnico previo. Timeout conserva desconocido y bloquea reenvío/descarte hasta consultar. Si ya registrado, consulta recupera aceptación del mismo documento; no encontrado permite reintento con misma clave/número. Respuesta inválida/ajena conserva desconocido. Descarte interno solo preparado/rechazado/no encontrado/fallo técnico, con motivo por Administración; no es baja/nota fiscal. Cargo revertido impide preparar/simular nuevo envío; consultas históricas de incertidumbre siguen disponibles.

Administración prepara/descarta; Administración y Caja leen/descargan/simulan/consultan, con TOTP/sesión reciente15min en mutaciones. Otros perfiles sin datos/archivos fiscales. Caja sin asunto/borrador jurídico. Descargas auditadas, `private, no-store` y verificación de integridad. UI usa componentes/tokens existentes, móvil/oscuro; muestra claramente que aceptación del simulador no es SUNAT.

Reutilización estática de código puro ELDIAL smartpse-xml/sunat-qr y declaraciones del adaptador, sin ejecución/configuración/secretos/BD de clientes. Ledger `docs/evidence/reuse-ledger.md`. Cálculos Float y clientes de red excluidos. Dependencias nuevas qrcode1.5.4, @types/qrcode1.5.6, jsqr1.4.0(dev), MIT en paquetes/lock.

## Verificación vigente 4.2

Build, TypeScript y lint correctos; **29 unitarias y46 E2E/API correctas**, cero fallos/omitidas/reintentos,106.941s. Suite `playwright.phase42.config.ts`/`phase42.spec.ts`, nueve escenarios `phase42.scenarios.ts` más37 de regresión. Conserva rate limit real y puede esperar60s ante429. Decodificación independiente de QR servido y XML leído con DOMParser. Axe/reflujo/teclado sin problemas en vistas cubiertas1440/683/390 y diálogo oscuro, sin conformidad WCAG total.

**Diez XML QA válidos contra XSD Invoice UBL2.1 de OASIS**, catorce esquemas públicos descargados temporalmente y hashes registrados. Scripts `export-phase42-xml.ts` (solo QA detenida) y `verify-fiscal-xsd.py` (Python/lxml6.1.1) validan localmente, sin enviar XML a red. No acredita reglas/catálogos SUNAT, política real o firma.

Doce grupos de integridad fiscal, siete tarifarios y doce financieros correctos en original/restauración. Fallo de auditoría revierte número/artefactos/recibo/evento/solicitud; respuesta de clave/huella ajena no afirma aceptación. Proyecciones reconstruidas de eventos, series/solicitudes coherentes, aislamiento y artefactos intactos. `verify-phase42-integrity.ts` agrega solo en QA un caso de timeout posterior si falta y lo deja desconocido en disco; en una copia reiniciada resuelve ese recibo una sola vez sin cambiar referencia/XML/serie/finanzas. No es una muestra de la instalación principal.

QA final **.notaria-phase42-qa-01** y restaurada **.notaria-phase42-restaurada-qa-01**, detenidas. Copia QA **backups/local-2026-10-29T10-40-53-743Z**. Comparación secuencial de **22tablas exactamente iguales** con `compare-phase42-restoration.ts`, sin mostrar contenidos. QA:10documentos,26eventos/solicitudes fiscales,8recibos,2series. Finanzas:38entradas,47solicitudes; deuda907.21,anticipos5.20,terceros100.00,efectivo100.00, todos sintéticos. Nuevos cargos explícitos de las pruebas explican deuda; simular fiscal no la altera.

Principal respaldada cerrada en **backups/local-2026-10-29T10-22-39-022Z**, tras identificar y detener el proceso Windows8076. Revisión activa **http://127.0.0.1:3100/fiscal**, sesión herramienta **98903**, base **.notaria/**. `check-review-phase42.ts` verificó acceso200, fiscal/tarifas/finanzas/casos/archivo401 anónimos y redirección a acceso, sin errores de página. Sin cuentas ni documentos QA en la principal. Nunca dos procesos por carpeta PGlite; confirmar procesos del host Windows, pues el sandbox puede ocultarlos.

## Antecedentes conservados

## Corte 4.1 implementado

Se eligió el tarifario porque BK-18/33 lo conservaban pendiente y condiciona el bloque fiscal BK-19. Migración **006**, aditiva a 001–005 y catálogo inicialmente vacío. Identidad por oficina/código estable; versiones con descripción, clasificación Honorarios/Terceros/Otros, acto específico o todos, precio unitario exacto, disponibilidad inmediata, motivo y autor. Desactivar/reactivar crea versión. Sin tarifas predeterminadas ni reglas tributarias inventadas.

`tariff_items`, `tariff_versions`, `tariff_requests`, `case_quote_tariffs` inmutables. Publicación por Administración con TOTP y sesión reciente de 15 minutos; todos los roles internos existentes consultan catálogo sin adquirir otros permisos. Bloqueo/revisión por oficina y versión base; UUID/huella canónica/actor/oficina; versión, auditoría, revisión y respuesta idempotente atómicas. Fallo de auditoría revierte todo.

Presupuesto selecciona tarifa activa vigente del mismo ámbito y acto. Servidor valida texto, clasificación/precio, disponibilidad y versión bajo bloqueo compartido del catálogo hasta confirmar propuesta/vínculos. Guarda UUID, instantánea y código/versión de procedencia. Tarifa nueva/desactivada no reescribe propuestas, aceptaciones, órdenes ni cargos. Cantidad modifica total conservando tarifa; editar precio/texto/clasificación en UI convierte explícitamente la línea en manual. Conceptos manuales siguen permitidos. Copiar tarifa histórica sustituida/inactiva exige reseleccionar o convertir a manual.

Importes como cadenas; precio `numeric(11,2)`, totales `numeric(14,2)` existentes y BigInt en céntimos. Publicar/aceptar no mueve dinero. Cargo explícito histórico conserva precio aceptado y excluye Terceros. Deuda, anticipos, custodia y obligaciones continúan separados.

Código: `src/lib/tariff-domain.ts`, `src/server/tariff-schema.ts`, `src/server/tariffs.ts`, `/api/tariffs`, `src/components/tariff-pages.tsx`, `tariff-picker.tsx`; integración en casos/presupuesto y permisos existentes. `/tarifario` en Más y menú móvil. `ControlledModal` ahora cierra/restaura foco al desmontarse: defecto detectado por prueba de Escape y corregido. Catálogo e historial completos para este entorno local; paginación/volumen pendientes antes del piloto.

## Núcleo anterior conservado

Auth Better Auth, contraseña/TOTP/códigos de recuperación, sesiones 8h sin refresco, origen estricto, rate limit y revocación por rol/habilitación. Permisos en servidor y alcance de oficina. Administración no equivale a revisión profesional. Personas con revisión; documentos privados versionados en cuarentena/liberación manual; auditoría inmutable. Configuración/personal y copias locales. Adaptador PostgreSQL externo disponible, no ensayado.

Expedientes persistentes: referencia anual administrativa idempotente, intervinientes con instantáneas, requisitos/historial, borradores SHA-256 canónico, revisión profesional por versión/contexto, tareas/notas/eventos, presupuestos/aceptaciones y orden de servicio. Referencia/revisión/orden no son numeración/autorización notarial. `store.tsx`, `fixtures.ts`, `case-views.tsx` son históricos; rutas actuales usan API y ThemeProvider, sin semillas en memoria.

Finanzas de migración005: cargos explícitos, cobros parciales, anticipos/aplicaciones/devoluciones, gastos autorizados con sustento privado versionado/proveedor, pagos parciales, recuperación explícita, custodia de terceros por origen/cliente/expediente/medio. Historial/idempotencia/aperturas/cierres/conciliaciones append-only; correcciones por reverso tras dependencias y retiro de conciliación. Apertura obligatoria para flujos; arqueo solo efectivo, reposición explícita de Administración; proteger custodia incluso tras faltante. Cuenta consolidada por ID sin netear ni unir nombres. Administración/Caja operan finanzas, solo Administración autoriza/revierte/concilia/repone; Caja sin contenido jurídico ni archivos privados.

## Verificación histórica 4.1

Build, TypeScript y lint correctos; **21 unitarias y 37 E2E/API correctas**, 0 fallos/omitidas/reintentos, 91.806 s. Regresión de fundamentos/casos/finanzas más siete escenarios de tarifario. La suite espera ventana real ante429, no relaja auth. Vigente `playwright.phase41.config.ts`, `phase41.spec.ts`, `phase41.scenarios.ts`; regresión reutilizada `phase3.scenarios.ts`/`phase4.scenarios.ts`, con prefijo de capturas separado. Datos sintéticos en **.notaria-phase41-qa-04**; servidor QA detenido.

Siete grupos de integridad tarifaria y doce financieros correctos en original y restauración CLI. Verificadores `verify-phase41-integrity.ts` y `verify-phase4-integrity.ts` solo bases QA detenidas. Inmutabilidad, aislamiento, fallo deliberado de auditoría revierte publicación/presupuesto/cargo/cierre y sus revisiones/solicitudes/vínculos, saldos/cierres reproducibles. `compare-phase41-restoration.ts` comparó exactamente quince tablas entre original y restauración, ambas cerradas, sin imprimir contenido.

QA final:5conceptos,7publicaciones,3vínculos tarifados,13expedientes,8presupuestos,5aceptaciones,29entradas financieras. Saldos sintéticos:deuda80.51,anticipos5.20,terceros100.00,efectivo100.00. Capturas tarifario1440/683/390 y diálogo oscuro; inspección visual, axe sin violaciones y reflujo/teclado correctos en vistas cubiertas, sin afirmar conformidad WCAG total.

Copia QA **backups/local-2026-10-29T08-56-53-254Z**; restaurada **.notaria-phase41-restaurada-qa-04**, detenida. Copia principal válida antes de migrar **backups/local-2026-10-29T08-47-33-352Z**, con servidor principal identificado y detenido desde Windows. No guardar claves ni BD/respaldos/trazas en Git o evidencia. Carpeta actual sin repositorio Git; fuentes/pruebas identificadas por manifiesto SHA-256 en evidencia.

El sandbox ocultaba procesos Windows y bloqueaba enlaces Turbopack/localhost. La inspección inicial restringida no acreditaba base cerrada; no usar aquella primera copia como evidencia de respaldo cerrado. Se corrigió comprobando/deteniendo el proceso real y haciendo copia nueva. **Verificar procesos/puertos desde Windows antes de abrir PGlite; nunca dos procesos sobre una carpeta.** Build/servidor/E2E finales en Windows con permiso apropiado. QA-02 detectó localizador estricto en prueba; QA-03 defecto de foco real; QA-04 final pasó completo.

## Revisión local y siguientes dependencias

El servidor y la evidencia vigentes están en la sección4.3 anterior. Al cierre4.1 la revisión usaba /tarifario y el corte fiscal estaba pendiente; ese antecedente queda superado por el contrato/simulador local4.2.

Pendiente fiscal real **BK-26**: emisor/series/certificado autorizados, reglas/catálogos y tratamiento fiscal validados, proveedor contratado y autorización de pruebas reales, outbox/trabajador/intención durable antes de red, consulta tras timeout y reconciliación. Los recibos locales transaccionales no demuestran integración externa. No conectar ni emitir por existir este contrato.

Procedimiento instrumental BK-15–17 pendiente: identificación/contingencias, otorgamientos, numeración instrumental y diligencia/entrega. El motor local BK-14 está implementado; textos propios y validación jurídica operativa siguen pendientes. No declarar completado todo fase3/4 ni saltar a cumplimiento/piloto.

Otros pendientes: RENIEC/SUNARP/firma reales, recuperación de contraseña/correo, antivirus/cifrado gestionados, políticas PLAFT/reserva/retención, revisión jurídica/contable, PostgreSQL gestionado, carga/RPO/RTO, capacitación y habilitación operativa. Sin publicación, envío de pagos o automatizaciones en este corte.

RTK leído en `C:/Users/ANDRE/.claude/RTK.md`; instalado0.44.2 verificado. Su hook de Claude no implica un hook de Codex. Reglas activas de usuario y AGENTS prevalecen sobre antecedentes del prompt maestro.

Evidencia finalfase5:127 fuentes SHA-256 y261 enlaces locales comprobados,0 rotos.

Cierre documentalfase6:142fuentes SHA-256; enlaces locales verificados en fase-6-documentacion.json,0rotos. Solo cinco fuentes anteriores modificadas; sin cambios de reglas económicas/fiscales/PLAFT/procedimiento.

Cierre de pruebas cloud:8enfocadas PostgreSQL correctas (38.9s),0fallos/omitidas/reintentos; JSONdeploy-neon-focused. Preservados2intentos de aserciones/contrato, sin cambios al dominio. HTTPS/login inicial/bloqueoTOTP/bootstrap403 verificados. Producción1staff,0personas/casos/documentos/cuentasQA y11migraciones. Las claves de gestión solo se utilizaron para el despliegue autorizado y no están enGit niVercelruntime. `.env.access.local` conserva la contraseña inicial únicamente en el equipo del usuario; ignorado porGit. QAservidor3101 detenido. Ver evidencia de despliegue para revisión exacta y estado de cierre.

Cierre publicado: código be6836343e8e44f91dd928c2fc38011d5ea83c68 verificado enVercel READY/dpl_wRbS6RdybfuMJTpVct8A89W6DyJ2. HTTPS/login/TOTPgate comprobados sobre esa revisión. GitHubmain sincronizado. Revisiónlocal3100 reabierta, sesión60384/Windows24328, baseprincipal original; no abrir desde scripts mientras esté activa. QAservidor3101 detenido. Las adiciones de evidencia posteriores solo documentan el código verificado.

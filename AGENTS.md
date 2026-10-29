# Instrucciones de NotariaOS

Leer `MEMORY.md` al iniciar o retomar. La instrucción activa del usuario prevalece sobre el prompt maestro y sus supuestos.

- Alcance confirmado el 29/10/2026: ERP para **una sola notaría**. ElDial es un ERP de retail y una referencia para reutilizar todo lo compatible. No es la notaría cliente.
- Autorización anterior (superada por la fase 2): André indicó «Continúa» después de recibir la fase 0. Desarrollar y verificar la fase 1: prototipo navegable con datos sintéticos y servidores locales. Integraciones reales, migraciones operativas y publicación no forman parte de este corte.
- Referencias en `C:\Users\ANDRE\Desktop\App prueba`: solo lectura; no ejecutar scripts, modificar archivos ni consultar bases de datos. No abrir secretos, respaldos ni datos de clientes.
- La reutilización autorizada de ElDial se prepara por componentes y contratos; no arrastrar sus identidades, datos, configuración productiva ni módulos ajenos al dominio.
- Corrección explícita de André en fase 1: **mismo login y misma estética de ElDial**, reconocibles como productos de Clix Web Studio. Conservar Montserrat y componentes ELDIAL_THEME, barra superior compacta, formularios/estados y composición del acceso. Se autoriza reutilizar los recursos de presentación de Clix. No volver a la propuesta azul/dorado con navegación lateral de escritorio; queda superada. Notaría continúa siendo una sola; identidad de familia SaaS no cambia ese alcance.
- Registrar evidencia y separar observado, antecedente, propuesta y pendiente. Una prueba leída no es una prueba ejecutada.
- Actualizar `MEMORY.md` al cerrar avances relevantes. No guardar secretos ni datos personales.
- Para escribir código posteriormente, confirmar versiones/documentación y ejecutar las pruebas pertinentes. Permisos en servidor, dinero decimal, versiones documentales y auditoría son requisitos del núcleo.
- Guardar decisiones en `docs/adr/` y mantener la trazabilidad entre alcance, backlog y pruebas.

Las lecturas o modificaciones de esta carpeta no autorizan cambios en ElDial ni publicación externa.

## Instrucción activa de fase 2 · 29/10/2026

- André autorizó continuar la fase 2 con interfaz ELDIAL **en negros y azules**. Esta paleta sustituye el rojo anterior: negro tinta #0D1728 y azul #174EA6. Conservar login, Montserrat, componentes, barra superior y familia Clix.
- Fundamentos locales implementados: Better Auth, TOTP obligatorio, permisos/alcance de oficina en servidor, personas, archivos privados versionados, cuarentena, configuración, personal, auditoría y copias locales. Leer `docs/phase-2/ENTREGA.md` y ADR 0002.
- `.notaria/` contiene la base y una clave privada. No abrir secretos ni incorporar directorios `.notaria*` o `backups/` a Git o salidas. No ejecutar dos procesos sobre un directorio PGlite. Las cuentas QA están solo en bases `.notaria-qa-*`, nunca en la instalación de revisión.
- En el corte histórico de fase 2 expedientes/caja/actuaciones eran sintéticos. Fases 3–4 sustituyen expedientes y caja por persistencia; actuaciones conserva su corte pendiente. No reintroducir semillas en rutas principales.
- Incluir BK-33 a BK-36 en las fases 3–4: presupuestos, gastos por expediente, fondos de terceros, proveedores y cuenta consolidada. Adiasoft/Eureka siguen siendo comparación funcional; no cambian la identidad visual.
- PostgreSQL de servicio, recuperación de contraseña, antivirus y revisión operativa siguen pendientes antes del piloto. No presentar esta entrega local como lista para operar.

## Instrucción activa de fase 3 · 29/10/2026

- André autorizó expedientes persistentes, requisitos, versiones y presupuestos con la estética negra/azul ELDIAL. Implementación local y migraciones 003–004 aditivas; leer `docs/phase-3/ENTREGA.md` y ADR 0003.
- No reintroducir los expedientes semilla ni operaciones en memoria en rutas principales. `store.tsx`, `fixtures.ts` y `case-views.tsx` son antecedentes del prototipo; el layout actual usa ThemeProvider y el expediente usa API/transacciones.
- Mantener separados presupuesto/aceptación/orden de servicio de caja, factura y autorización notarial. Dinero exacto en cadenas/numeric; versiones y aceptaciones inmutables; permiso profesional separado de administración.
- La referencia kardex es administrativa. Plantillas jurídicas, identidad, otorgamientos, numeración instrumental, diligencia y entrega persistentes conservan su corte pendiente. No presentar revisión de preparación como autorización legal.
- Suite vigente: `playwright.phase3.config.ts`, `tests/e2e/phase3.spec.ts` y `phase3.scenarios.ts`, siempre en base QA nueva y separada. No usar cuentas QA en `.notaria/`.

## Instrucción activa de fase 4 · 29/10/2026

- André autorizó caja, cobros, anticipos, gastos, fondos de terceros y estado de cuenta según plan, conservando ELDIAL negro/azul. Leer `docs/phase-4/ENTREGA.md` y ADR 0004; versión 0.4.0, migración 005 aditiva.
- Rutas `/caja` y secciones consultan `/api/finance`; no montar módulos financieros del prototipo ni escribir operaciones en memoria. `finance.ts` conserva separación deuda/anticipos/custodia/obligaciones. Presupuesto se traslada explícitamente a cargo propio, una vez; no se carga Terceros como ingreso.
- Entradas, solicitudes idempotentes, proveedores, sesiones, cierres y conciliaciones inmutables. Correcciones mediante reverso, dependencias primero. Bloqueo por oficina, revisión, UUID/huella/actor y auditoría en misma transacción. No sustituir dinero decimal por Number.
- Administración y Caja tienen acceso financiero; autorizar gastos, revertir, conciliar y reponer fondo corresponde a Administración. Caja conserva exclusión del contenido jurídico/archivos privados. Mutaciones con TOTP y sesión reciente.
- Gastos con proveedor, clasificación, vencimiento y versión privada liberada. Fondos de terceros por origen/cliente/expediente/medio; proteger efectivo en custodia. Cierre histórico no se modifica por reversos posteriores; reposición al abrir explícita y exclusiva de Administración.
- Suite actual `playwright.phase4.config.ts`, `phase4.spec.ts`/`phase4.scenarios.ts` más regresión de casos. 18 unitarias y 30 E2E correctas; control de autenticación permanece activo, QA puede esperar una ventana al recibir 429. Base QA final `.notaria-phase4-qa-04`, restaurada `.notaria-phase4-restaurada-qa-04`, servidores QA detenidos.
- Constancias internas, sin emisión SUNAT, liquidación tributaria, tarifario administrable, adaptador fiscal simulado o banco conectado. Esos cortes, trabajo instrumental pendiente de fase 3 y preparación operativa siguen explícitos. No presentar esta entrega como operación habilitada.

## Continuación activa · Fase 4.1 · 29/10/2026

- André pidió retomar el proyecto, comprobar estado y ejecutar el siguiente corte. Se completó el tarifario administrable BK-18/33 como siguiente dependencia económica local; leer entrega 4.1 y ADR 0005.
- Migración 006 aditiva; catálogo vacío. `tariff_items`, `tariff_versions`, `tariff_requests` y `case_quote_tariffs` inmutables. Publicación inmediata por Administración, TOTP/sesión reciente, revisión e idempotencia; otros roles internos consultan sin permisos jurídicos adicionales.
- Presupuesto valida versión activa/oficina/acto y precio en servidor bajo bloqueo compartido. Guarda instantánea y vínculo histórico. Editar descripción/clasificación/precio convierte una línea en manual de forma visible; cambiar cantidad conserva procedencia. No reescribir presupuestos ni aceptaciones al versionar tarifas.
- Ruta `/tarifario`, API `/api/tariffs`; conservar estética ELDIAL/Clix. BK-19 XML/QR y adaptador simulado siguen pendientes, al igual que emisión SUNAT y BK-14–17 instrumentales. No declarar todas las fases completas.
- Suite vigente `playwright.phase41.config.ts` / `phase41.spec.ts`, regresión reutilizada de fases 3–4 y nuevos escenarios 4.1. Siempre base nueva y separada; servidor detenido antes de scripts de integridad, copia o restauración.
- El sandbox puede ocultar procesos/puertos de Windows. Comprobar el propietario desde Windows antes de abrir una carpeta PGlite; un resultado vacío restringido no acredita que la base esté cerrada.

- Validación final 4.1:21unitarias y37E2E/API correctas;7grupos de integridad de tarifa y12financieros en original/restauración. QA final `.notaria-phase41-qa-04`, restaurada `.notaria-phase41-restaurada-qa-04`, ambas detenidas. Revisión3100 activa, base `.notaria/`, sin alta QA. Detalles y comandos en evidencia4.1.

## Continuación activa · BK-19 / Fase 4.2 · 29/10/2026

- André autorizó contrato XML/QR y adaptador simulado, expresamente sin proveedores reales ni SUNAT. Implementado localmente en 0.4.2; leer entrega4.2, CONTRATO-FISCAL.md y ADR0006. No reemplaza la validación tributaria/operativa ni BK-26 real.
- Migración007 aditiva. Documentos/artefactos, eventos, solicitudes y recibos simulados inmutables; proyecciones/contadores reconstruibles. `/fiscal`, `/api/fiscal`, FiscalAdapter de modo fijo simulation. Sin URL, claves, certificados, firma o ruta productiva.
- Origen: cargo propio de presupuesto aceptado no revertido, un documento activo por cargo. Terceros excluido; los supuestos de impuestos se eligen por línea para el ejercicio, precios finales exactos conservados. Ninguna acción fiscal cambia saldos o pagos.
- Emisor ficticio fijo, RUC00000000000 y series SIM internas. XML/QR marcados sin validez tributaria, sin firma; respuesta del simulador no es CDR. No añadir un toggle a producción.
- Administración prepara/descarta, Administración/Caja consulta/descarga/simula; mutaciones con TOTP/sesión reciente. Respuesta debe corresponder a UUID de documento y huella. Desconocido exige consulta y bloquea reenvío/descarte; reintento conserva clave/número. Descarte no es baja fiscal.
- Suite actual `playwright.phase42.config.ts`/`phase42.spec.ts`, base nueva `.notaria-phase42-qa-*`. 29 unitarias y46 E2E correctas. QA final `.notaria-phase42-qa-01`, restaurada `.notaria-phase42-restaurada-qa-01`, detenidas. Verificador42 agrega solo en QA un timeout de recuperación si no existe; prueba resolución en copia en memoria sin alterar el estado original.
- Principal respaldada cerrada antes de migrar; revisión3100 activa sin cuentas ni documentos QA allí. Comprobar procesos Windows reales antes de abrir PGlite. Decisiones y evidencia incluyen límites de XSD/catálogos/política real, firma/CDR/proveedor y outbox futuros.

## Continuación activa · BK-14 / Fase 4.3 · 29/10/2026

- André autorizó plantillas jurídicas, conservar ELDIAL, QA separada y emisión real SUNAT deshabilitada. Versión 0.4.3, migración 008 aditiva; leer entrega 4.3 y ADR 0007. La etiqueta 4.3 es incremental y no declara completas las fases originales.
- Catálogo vacío por oficina. Abogado/Notario publica texto plano, variables tipadas y revisión explícita del texto base; Administración/Recepción consulta/genera sin adquirir revisión profesional. Caja sin acceso. Todas las mutaciones/vistas previas requieren TOTP y sesión reciente.
- `/plantillas` y `/api/templates`. Motor `plain-v1`, sustitución literal sin eval/HTML activo/condiciones/red. Variables obligatorias texto/fecha/PEN exacto/entero/interviniente; interviniente elegido de instantáneas del expediente, nunca de la ficha viva por inferencia.
- Versiones, solicitudes y vínculos append-only. Generación agrega borrador con instantánea de plantilla/valores/contexto/huella, sin modificar versiones previas ni finanzas/fiscal. Revisión nueva por documento/contexto. Publicar/retirar una plantilla no reescribe documentos históricos. Edición manual posterior queda identificada como manual.
- Bloqueo expediente antes de catálogo, revisión/versiones e idempotencia por UUID/huella/actor/oficina. Auditoría transaccional; conflicto conserva formulario, actualización de base profesional explícita. Mantener estas garantías al extender el motor.
- Suite vigente `playwright.phase43.config.ts` / `phase43.spec.ts`: 37 unitarias y 55 E2E/API correctas. QA final `.notaria-phase43-qa-02`, siempre separada; detener y comprobar propietario Windows antes de verificadores/copias. Evidencia/estado de restauración y servicio en MEMORY y entrega.
- No se entregan cláusulas jurídicamente aprobadas, DOCX/PDF, firma/autorización o numeración instrumental. BK-15–17 y revisión jurídica operativa siguen pendientes. BK-26 real deshabilitado, sin toggle ni proveedor.

## Instrucción vigente · Fase 3 integrada · 29/10/2026

André autorizó BK-15 y confirmó **BK-15 a BK-17 juntos** para volver a entregas por fases completas. No crear más fases 4.4/4.5 ni pedir continuación historia por historia. Conservar las evidencias 4.1–4.3 como historia. El paquete 0.5.0 es una versión técnica, no fase 5. Leer entrega vigente de fase 3, ADR0008 y evidencia de procedimiento.

Migración009 aditiva; `/api/procedures/[caseId]` y pestañas Identificación/Actuación/Diligencia y entrega. Identidad fija simulada; resultados distintos, consulta de desconocido, excepción con sustento solo Notario. Comparecencias vinculadas a participante/identidad/borrador/contexto. Registro local solo Notario con requisitos y revisión vigentes; números/folios SIM, nunca oficiales. Incidencias append-only; no reutilizar números. Carta con varios intentos/resultados/constancia y entrega al solicitante separadas. Constancias internas privadas sin firma/validez notarial. No inferir capacidad, representación o habilitación real por rol.

Bloqueo expediente antes de contador; idempotencia/auditoría atómicas. Dos historias append-only y contador reconstruible. Política de ejercicio versionada, todos los participantes requeridos; validación jurídica antes de uso real. Ningún evento cambia saldos, tarifas o fiscal. Caja excluida. ELDIAL conservado. Bases QA nuevas `.notaria-procedure-qa-*`, detener/comprobar propietario real antes de abrir PGlite. SUNAT real permanece deshabilitado.


Validación de cierre de fase 3:41 unitarias;54 regresiones anteriores y10 escenarios enfocados finales correctos. El pase integrado anterior conserva1 fallo de axe ya corregido/1 omitido; no presentarlo como todo verde. Leer evidencia para distinguir pasadas.14 grupos de integridad en original/restaurada y41 tablas iguales incluyendo archivos privados. QA-03 integrada/restaurada yQA-05 enfocada detenidas; revisión3100, sesión59943/Windows16688, base principal sin QA.114 fuentes SHA-256,228 enlaces locales válidos.

## Instrucción vigente · Fase 5 completa · 29/10/2026

André autorizó fase5 completa, BK-21–23 juntos, **sin subfases**. Versión0.6.0/migración010, entrega phase-5, ADR0009. Dos áreas `/cumplimiento/plaft` y `/cumplimiento/privacidad`, API `/api/compliance`. PLAFT solo Notario custodio local; Administración no ve contenido/recuentos/descargas. Privacidad Administración/Notario; política y levantamiento de conservación solo Notario. No se acredita designación real por rol. No trasladar información reservada a actividad de casos, documentos generales o auditoría general; auditar acciones sin contenido ni identificadores reservados.

Cuatro tablas append-only y revisión por oficina/área; UUID/hash/actor/oficina, cadena SHA-256, auditoría y artefacto en misma transacción. Dinero PEN exacto, sin movimientos financieros. Políticas/avisos congelados; ARCO identidad/plazo/respuesta y ampliación; bloqueos hasta levantamiento explícito; ningún borrado automático. Incidentes por hito y destinatario; no aplicación fundada y constancia externa separada. Exportación interna validada `notariaos-ro-review-v1`, no archivo oficial. Formato SBS/OCP deshabilitado hasta homologación/anexos/régimen y autorización. SUNAT real deshabilitado; sin proveedores/ROS/envíos.

Suite vigente `playwright.phase5.config.ts`/`phase5.spec.ts`, QA nueva `.notaria-phase5-qa-*`, nunca `.notaria/`. Verificadores solo QA detenida; comprobar propietario Windows antes de abrir PGlite. No dos procesos por carpeta. Próxima fase original6 condicionada a convenios y autorización. Leer MEMORY y evidencia para resultados finales y servicio vigente.

Cierrefase5:47unitarias y74E2E/API correctas (una pasada final completa,0 fallos/omitidas/reintentos),13grupos de integridad en original/restaurada,46tablas iguales. QA-03/restaurada detenidas, principal3100/sesión95492/Windows13544. Evidencia conserva dos fallos previos de aserciones. No sobrescribir esos antecedentes.

Evidencia finalfase5:127 fuentes SHA-256 y261 enlaces locales comprobados,0 rotos.


## Instrucción vigente · Fase6, alcance local integrado · 29/10/2026

André autorizó fase6 sin subfases, comprobar dependencias e implementar todo lo local. Versión0.7.0/migración011, entrega/DEPENDENCIAS phase-6, ADR0010 y evidenciafase6. **La fase real NO está cerrada**: no hay convenio/lector RENIEC, certificado/validador/canalSID o proveedor/cuenta demo/autorización acreditados. No declarar integración real completada ni conectar por una evaluación declarada.

Tres canales `/integraciones/reniec|sunarp|fiscal`, API `/api/integrations`. Cuatro tablas append-only y estado por oficina/canal; lock expediente→canal, UUID/hash/actor, revisión y auditoría atómica. Contrato de identidad probado solo local, nohardware/biometría. FirmaSIM negativa/favorable, trasladoSIM por origen exacto; archivoexterno/informe/cargo privado solo declarado-no-verificado. Última evaluación favorable exacta antes de cargo único; descargar no presenta. Demo fiscal declarada porUUID/hash no cambia fiscal/dinero. Todos los bloqueos reales fijos, sin toggle/transporte/secretos. SUNAT y formato oficialSBS/OCP siguen deshabilitados. No duplicar informaciónPLAFT en estos canales.

Caja solo canal fiscal, sin recuentos/archivos jurídicos; Notario sin fiscal. Firma/informe/cargo soloNotario deejercicio, sin inferir habilitaciónreal. Mantener ELDIAL/Montserrat/login/barra/negro-azul/oscuro/móvil. QA nueva `.notaria-phase6-qa-*`, nunca principal. Verificadores con guardiaWindows y destructivas enmemoria; no dosprocesos porPGlite.

Cierre local:52unitarias/83E2E correctas,15grupos integridad original/restaurada,51tablas iguales. QA03/restaurada detenidas; principal3100/sesión63919/Windows25260, sinaltasQA. Leer MEMORY y evidencia para copias, resultados y límites vigentes. No borrar intentos previos. RTK.md referenciado no disponible en ubicaciones revisadas.

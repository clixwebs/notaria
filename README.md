# Entrega vigente · Fase 6, alcance local integrado

NotariaOS **0.7.0**, 29/10/2026. BK-24–26 juntos y sin subfases. Más → **Integraciones y traslados**: evaluación versionada de dependencias; contrato de identidad local sin operar lector; firma simulada y traslado de instrumento SIM; seguimiento de archivo externo con informe/cargo privados declarados; evidencia externa de demo fiscal ligada a XML exacto. Declarado o simulado nunca significa validado, presentado o aceptado realmente.

[Entrega](docs/phase-6/ENTREGA.md) · [Dependencias pendientes](docs/phase-6/DEPENDENCIAS.md) · [ADR0010](docs/adr/0010-integraciones-locales-y-traslado-asistido.md) · [Evidencia](docs/evidence/fase-6.md).

**La fase real sigue pendiente** de convenio/dispositivo RENIEC, certificado/validador/canal SID, proveedor/cuenta demo y autorización. No hay conexiones ni emisión SUNAT, firma criptográfica, comunicaciones externas o formato oficial SBS/OCP habilitados. Montserrat/login/ELDIAL, negro-azul, navegación compacta, oscuro/móvil y módulos anteriores conservados. Una sola notaría; ELDIAL es referencia retail.

Suite vigente `playwright.phase6.config.ts` / `tests/e2e/phase6.spec.ts`, `npm run test:e2e`; QA nueva `.notaria-phase6-qa-<nuevo>` en3101. Migración011 aditiva. Nunca dos procesos por carpeta PGlite ni cuentas QA en `.notaria/`. Los comandos y estados siguientes son antecedentes históricos, no sustituyen esta suite o el alcance vigente.

---

# Entrega vigente · Fase 5 completa local

NotariaOS **0.6.0**, 29/10/2026. André autorizó entregar **BK-21 a BK-23 juntos**, sin subfases: diligencia/riesgo y bandeja PLAFT reservada; finalidades/avisos/consentimiento, ARCO, incidentes y conservación; exportaciones internas versionadas/validadas con cargo separado. [Entrega](docs/phase-5/ENTREGA.md) · [ADR0009](docs/adr/0009-cumplimiento-local-reservado.md) · [Evidencia](docs/evidence/fase-5.md).

Más → Cumplimiento. PLAFT solo perfil Notario custodio local; Privacidad para Administración/Notario, con publicación de políticas y levantamiento de bloqueos reservados a Notario. No hay políticas ni clientes precargados. Conserva ELDIAL, oscuro/móvil y módulos previos. Formato oficial SBS/OCP **deshabilitado** hasta homologar anexos/régimen; el archivo interno no es presentación. Sin ROS automático, comunicaciones externas, borrado automático o emisión real SUNAT. La validación jurídica y operativa continúa siendo condición antes del piloto.

Suite vigente `playwright.phase5.config.ts` / `tests/e2e/phase5.spec.ts`, `npm run test:e2e`, con QA nueva `.notaria-phase5-qa-<nuevo>` en3101. Nunca dos procesos sobre una carpeta PGlite ni cuentas QA en principal. Migración010 aditiva. Siguiente fase original:6, integraciones condicionadas a autorización/convenios; no se habilitan por esta entrega.

---

## Antecedente de fase 3 integrada

# Entrega vigente · Fase 3 integrada

NotariaOS **0.5.0**. BK-15 a BK-17 juntos: identidad simulada, otorgamientos/comparecencias, registro y folios SIM concurrentes, certificación local, cartas con intentos y constancia, entrega trazable. Conserva plantillas, expedientes, presupuesto y núcleo económico ya funcional. Se retoman **fases enteras**, sin nuevas etiquetas decimales; las anteriores quedan como historial. La versión del paquete es independiente del número de fase.

[Entrega y recorrido de fase 3](docs/phase-3/ENTREGA.md) · [Decisiones](docs/adr/0008-procedimiento-instrumental-local.md) · [Evidencia](docs/evidence/fase-3-procedimiento.md).

En un expediente: Documento → Identificación → Actuación → Diligencia y entrega. Notario tiene las decisiones reservadas. El registro tiene marca de simulación y no sustituye identidad, firma o autorización reales. SUNAT real sigue deshabilitado. Siguiente bloque original: fase 5, cumplimiento; integraciones reales requieren autorización.

Suite vigente `npm run test:e2e` usa `playwright.procedure.config.ts` y QA nueva en puerto 3101 con `NOTARIA_DATA_DIR=.notaria-procedure-qa-<nuevo>` y `NOTARIA_URL=http://127.0.0.1:3101`, sin `DATABASE_URL`. Nunca reutilizar QA ni ejecutar dos procesos sobre PGlite. La revisión principal de puerto 3100 conserva `.notaria/` sin altas QA.

---

## Antecedentes y fundamentos

# NotariaOS

ERP para **una notaría peruana**, de la familia visual ElDial / Clix Web Studio.

**Estado: 0.4.3 · BK-14 local para revisión, 29/10/2026.** Login y estructura de ELDIAL, Montserrat, negro tinta y azul jurídico según la última instrucción de André.

## Abrir y probar

Con Node 24, desde esta carpeta:

```powershell
npm ci
npm run build
npm start
```

Abrir [acceso local](http://127.0.0.1:3100/acceso). En la primera visita, crear la cuenta administradora, iniciar sesión y verificar TOTP con una aplicación autenticadora. Guardar los códigos de recuperación. No existen credenciales prellenadas ni una cuenta administrativa compartida.

Personas, expedientes, intervinientes, requisitos, borradores/revisiones, presupuestos/aceptaciones, órdenes de servicio, caja, cobros, anticipos, gastos, fondos de terceros, proveedores, tarifario versionado, documentos fiscales de prueba, tareas, archivos, usuarios y auditoría se conservan en `.notaria/`. Esa carpeta contiene también la clave de autenticación y es privada. Las rutas principales ya no cargan expedientes predeterminados en memoria. Identificación, actuaciones, diligencia/entrega y emisión fiscal/integraciones requieren sus próximos cortes.

- [Entrega y guía de BK-14 · Plantillas jurídicas](docs/phase-4-3/ENTREGA.md).
- [Decisión de plantillas versionadas](docs/adr/0007-plantillas-juridicas-versionadas.md).
- [Evidencia actual de BK-14](docs/evidence/fase-4-3.md).
- [Entrega y guía de BK-19 / fase 4.2](docs/phase-4-2/ENTREGA.md).
- [Contrato fiscal XML/QR de simulación v1](docs/phase-4-2/CONTRATO-FISCAL.md).
- [Decisión fiscal local](docs/adr/0006-contrato-fiscal-y-simulador-local.md).
- [Evidencia de fase 4.2](docs/evidence/fase-4-2.md).
- [Entrega y guía de fase 4.1 · Tarifario](docs/phase-4-1/ENTREGA.md).
- [Decisión de tarifario versionado](docs/adr/0005-tarifario-versionado.md).
- [Evidencia de fase 4.1](docs/evidence/fase-4-1.md).
- [Entrega y guía de fase 4](docs/phase-4/ENTREGA.md).
- [Decisión de caja y cuentas](docs/adr/0004-caja-y-cuentas-persistentes.md).
- [Entrega y guía de fase 3](docs/phase-3/ENTREGA.md).
- [Decisión de expedientes y presupuestos](docs/adr/0003-expedientes-y-presupuestos-versionados.md).
- [Fundamentos y guía de fase 2](docs/phase-2/ENTREGA.md).
- [Decisión técnica y visual aplicada](docs/adr/0002-fundamentos-locales-y-paleta-juridica.md).
- [Evidencia de pruebas y límites](docs/evidence/fase-4.md).
- [Comparación funcional con Adiasoft y Eureka](docs/phase-1/comparativa-mercado.md).
- [Backlog ampliado: presupuestos, gastos, terceros y cuenta consolidada](docs/phase-1/backlog-ampliado.md).
- [Plan maestro](docs/phase-0/PLAN-MAESTRO.md), [arquitectura conceptual](docs/phase-0/03-arquitectura-modelo.md), [backlog original](docs/phase-0/04-backlog-y-validacion.md) y [matriz normativa inicial](docs/compliance/matriz-normativa.md).

## Verificación

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

Las pruebas vigentes de navegador usan Chrome y una **instancia QA vacía y separada** en 3101. En otra terminal PowerShell, después de compilar:

```powershell
$env:NOTARIA_DATA_DIR=".notaria-phase43-qa-$(Get-Date -Format yyyyMMdd-HHmmss)"
$env:NOTARIA_URL='http://127.0.0.1:3101'
npx next start --hostname 127.0.0.1 --port 3101
```

Ejecutar `npm run test:e2e`. La suite crea cuentas/fichas ficticias únicamente en esa base y verifica TOTP, permisos, recuperación, concurrencia de expedientes, instantáneas, borradores, presupuestos, cobros/anticipos, fondos de terceros, gastos, reversos, arqueos, conciliación, tarifas/versiones, conservación de precios aceptados, fiscal simulado, plantillas jurídicas, formularios y accesibilidad. Usar una base nueva en cada ejecución. El archivo de pruebas de fase 1 permanece como antecedente; la configuración vigente selecciona `phase43.spec.ts` y sus escenarios. La suite respeta el límite real de autenticación: puede esperar una ventana de 60 segundos.

Para desarrollo: `npm run dev`. Las instrucciones de copia/restauración y los límites del entorno local están en la guía de fase 2. No desplegar esta configuración como operación real; se mantienen pendientes explícitos para el piloto.

El catálogo empieza vacío. Administración publica en [Tarifario](http://127.0.0.1:3100/tarifario), disponible en Más y navegación móvil. El presupuesto permite elegir una tarifa o un concepto manual. XML/QR y adaptador de prueba están en [Laboratorio fiscal](http://127.0.0.1:3100/fiscal). Los archivos llevan SIM/SIN VALIDEZ y no se envían a proveedores. La validación fiscal completa y emisión real SUNAT siguen pendientes.

El catálogo de [plantillas jurídicas](http://127.0.0.1:3100/plantillas) empieza vacío. Abogado/Notario publica textos y variables; desde Documento del expediente se genera una versión con procedencia, valores y huella. Administración/Recepción puede generar, pero la revisión profesional permanece separada. Los textos de la notaría requieren validación jurídica antes de operar; no se precargan cláusulas aprobadas. La emisión real SUNAT permanece deshabilitada.

Antes de copias, restauración o verificadores de integridad, detener el servidor propietario de esa carpeta PGlite. En Windows, una inspección desde el sandbox puede ocultar los procesos del host; comprobar también el propietario real.

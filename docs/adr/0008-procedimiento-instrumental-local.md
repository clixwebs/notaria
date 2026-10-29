# ADR 0008 · Identificación, registro y entrega locales

Estado: implementación local de BK-15 a BK-17, 29/10/2026. Completa el bloque de procedimiento de **fase 3**, junto a expedientes, documentos, plantillas y presupuesto ya existentes. No habilita operación notarial real.

## Entregas por fases

André pidió volver a entregar fases completas y confirmó expresamente incluir BK-15, BK-16 y BK-17 juntos. Se dejan de crear fases decimales. Las entregas 4.1–4.3 se conservan como evidencia histórica, sin renombrarlas ni repetirlas. La versión técnica 0.5.0 no significa fase 5. La entrega vigente del procedimiento está en `docs/phase-3/ENTREGA.md`; el siguiente bloque del plan es fase 5, pues el núcleo económico local de fase 4 ya está implementado. Las integraciones reales siguen en fase 6 y requieren autorización.

## BK-15 · Identidad

`IdentityAdapter` tiene modo fijo `simulation`, sin URL, credenciales, lector, biometría ni llamadas a RENIEC. Escenarios explícitos para ejercicios: coincidencia, no coincidencia, error técnico y desconocido. Un desconocido exige consulta simulada antes de otro intento o excepción; no se interpreta como fallo ni éxito. La consulta agrega evidencia y conserva el intento.

Cada evidencia se vincula a participación, instantánea del expediente y UUID de borrador. No se reutiliza globalmente ni sobre una versión nueva. Se conserva la distinción entre persona en ficha y compareciente de la versión. Ante no coincidencia/error conocidos, solo Notario puede registrar excepción local, fundamento de al menos 20 caracteres, aceptación explícita y versión privada liberada del mismo interviniente. No se presume que una excepción legal sea admisible en la realidad: estas reglas son **política de ejercicio**, pendientes de validación jurídica antes de BK-24.

## BK-16 · Comparecencia, registro y numeración

Política `procedimiento-local-v1`: todos los participantes agregados se consideran requeridos. No se infiere exención por rol, persona jurídica, nombre o tipo documental. Si el caso exige representante/testigo/intérprete debe incorporarse expresamente y registrar los requisitos de representación aplicables. No se determina capacidad o suficiencia de poderes automáticamente.

Comparecencia/conformidad guarda participante, instantánea, versión/huella del borrador, evidencia de identidad exacta, revisión del contenido, sustento privado liberado, autor y motivo. En compraventa se presenta como otorgamiento de prueba; en certificación, comparecencia para certificación; en carta, conformidad del solicitante. La interfaz conserva requisitos distintos por acto; no exige minuta en certificación/carta.

Solo Notario registra el instrumento local. Servidor exige última versión, huella correcta, revisión profesional del contexto vigente, requisitos completos y conformidad con identidad vigente de todos los participantes. Revalida liberación de sustentos de comparecencia/excepción. Un cambio de contenido invalida revisión/conformidad, y un nuevo intento de identidad invalida la conformidad que apuntaba a la evidencia anterior. Ninguna acción de procedimiento concede revisión profesional ni aceptación comercial.

Un registro activo por expediente. Número interno `SIM-ESCR`, `SIM-CERT` o `SIM-CARTA`, año civil de Lima y secuencia por oficina/año/acto. Folios de prueba asignados automáticamente como rango consecutivo según cantidad solicitada; nunca se toma número/rango del cliente. La clave completa de registro incluye oficina, protegida además por un índice único parcial sobre los eventos de registro. No es apertura de protocolo, escritura ni certificación real. Identidad, borrador, participantes, requisitos y conformidades se congelan en el evento.

Una incidencia del Notario deja sin efecto el registro local, sin borrar el instrumento ni liberar su número o folios. Para reemplazarlo se evalúa de nuevo el contexto/documento vigente y se asigna otro número. Modificar la ficha o el borrador no reescribe un instrumento histórico. Estos registros no ejecutan subsanación, nulidad o cancelación jurídica de un acto real.

## BK-17 · Certificación, cartas y entrega

En certificación el registro local congela la comparecencia y texto revisados; no se fabrican firmas ni se certifica físicamente un documento. La carta admite programación con destinatario/dirección explícitos, fecha y responsable activo de esta oficina; un intento pendiente debe obtener resultado antes de otro. Cada intento conserva resultado, fecha de negocio, captura, sustento y motivo: entregada, rechazada, no encontrado, error técnico o desconocido.

Un desconocido se aclara mediante evento adicional y sustento, sin sustituir el resultado original. Solo Notario cierra la constancia de carta, con todos los intentos resueltos; puede constar rechazo/no encontrado/error sin afirmar entrega al destinatario. La constancia congela los intentos y resultados evaluados. No se programan más intentos tras cerrarla. Si requiere otra actuación, incidencia y nuevo registro.

Entrega al solicitante es otro evento, con participante de la instantánea autorizada, evidencia liberada de esa persona y aceptación explícita. En carta exige constancia; en certificación/compraventa exige registro activo. Una entrega por instrumento, con reintento idempotente; no envía documentos por un canal real. Representación/entrega parcial y formato legal de salida requieren reglas operativas adicionales. No se presume destinatario autorizado por coincidencia de nombre.

Consulta y descarga `.txt` interna, con marca inequívoca sin firma/validez notarial, auditadas y privadas. No se implementa PDF/DOCX, firma, traslado registral ni cargo de presentación; BK-25 sigue pendiente. No se exige saldo financiero cero como supuesto jurídico ni se cambian pagos/deuda/anticipos/terceros al entregar; la política operativa de entrega y pago debe revisarse con la notaría.

## Persistencia y controles

Migración 009 aditiva. `procedure_events` y `procedure_requests` append-only; `instrument_counters` proyección reconstruible. Huella canónica SHA-256 por evento; no es firma o anclaje independiente. Eventos y solicitudes no se actualizan/eliminan. Lecturas verifican huellas; auditoría sensible no guarda el texto de documentos.

Bloqueo primero sobre expediente, después contador de oficina/año/acto. Serializa con edición documental, plantillas, requisitos y participantes. Numeración, folios, evento, revisión global, actividad, auditoría y solicitud se confirman en una transacción. El contenido no cambia por registrar evidencia; `content_revision` conserva su semántica documental. UUID/hash/actor/oficina/caso para reintentos: una solicitud confirmada devuelve el resultado original aun tras una incidencia; cambiar payload/actor produce conflicto. Conflictos y fallos conservan formulario y permiten actualizar contexto explícitamente.

Administración, Recepción, Abogado y Notario consultan/registran evidencia. Solo Notario exceptúa, registra instrumento, deja sin efecto o cierra constancia. Caja queda excluida de contenido jurídico y descargas. Permisos en servicio/servidor, oficina, origen exacto, TOTP y sesión de hasta 15 minutos para mutaciones. Cuerpo limitado y esquemas estrictos, sin selector de modo real. La habilitación profesional real y política del oficio siguen pendientes de validación; un rol local no las acredita.

Se reutilizan componentes/tema ELDIAL, diálogos, documentos privados, auditoría, transacciones, instantáneas y suite existentes; sin dependencias nuevas ni acceso a `App prueba`. Los eventos no tocan finanzas, tarifas, plantillas ni fiscal. SUNAT real sigue deshabilitado.

## Fuentes técnicas verificadas

- [PostgreSQL 17: bloqueos explícitos](https://www.postgresql.org/docs/17/explicit-locking.html), para exclusión por fila y orden de bloqueos.
- [Zod: uniones discriminadas y esquemas estrictos](https://zod.dev/api?id=discriminated-unions), para contratos por comando.

La implementación no interpreta normativa notarial ni sustituye revisión jurídica. Los escenarios sintéticos demuestran controles técnicos y conservación histórica.

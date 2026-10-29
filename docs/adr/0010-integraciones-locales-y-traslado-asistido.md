# ADR 0010 · Integraciones locales y traslado asistido

29/10/2026 · Versión técnica 0.7.0. Una sola entrega de fase 6, BK-24–26. Se implementa el alcance local autorizado; **el cierre real de la fase sigue condicionado**. No se crean subfases ni se redefine como ejecutado lo que requiere acceso externo.

## Alcance comprobado

El plan original exige identidad/firma habilitadas, traslados y SUNARP asistido o canal documentado, con contratos/acceso/pruebas reales autorizadas por integración. BK-24 pide spike de lector/canal RENIEC y adaptador real autorizado; BK-25 firma, validación, traslado, cargo y seguimiento asistido; BK-26 demo real fiscal y conciliación, con habilitación aparte. Los simuladores existentes de identidad y fiscal son antecedentes locales, no conexiones acreditadas. No se aportaron convenio, dispositivo, certificado, contrato de proveedor, credenciales ni autorización de conexión. No se buscaron secretos.

## Decisión

Agregar `/integraciones/reniec`, `/integraciones/sunarp`, `/integraciones/fiscal` y `/api/integrations`. Migración 011 aditiva: registros, eventos, solicitudes y manifiestos append-only; estado de revisión por oficina/canal reconstruible. Catálogo vacío. Identidad/fiscal conservan sus implementaciones fijas de simulación. `realIntegrationGate` es falso para los tres canales; no hay transporte, URL, claves, certificados ni interruptor de habilitación. Declarar una dependencia resuelta no conecta nada.

BK-24 ejecuta los cuatro resultados del contrato simulado y explicita que hardware/controladores/convenio **no se probaron**. Se guarda descripción del equipo y evaluación versionada de condiciones/pendientes/responsable. No captura biometría ni registra una identidad favorable para un participante. El resultado desconocido conserva el recorrido de consulta del módulo de procedimiento.

BK-25 tiene dos orígenes que no se intercambian:

- **Ejercicio:** manifiesto JSON interno congelado del instrumento SIM activo y su borrador exacto, con historial de origen y huellas. Sin PDF notarial, firma ni parte oficial. El adaptador de firma simula favorable/inválida/revocada/indisponible; siempre `cryptographicallyVerified=false`. Solo el último resultado favorable de esa huella permite un cargo simulado. Descargar no presenta. Un instrumento dejado sin efecto impide agregar validaciones/cargos al traslado, conserva lo anterior.
- **Archivo externo declarado:** referencia a versión privada liberada de un participante del expediente, con comprobación de sus bytes/hash. No deriva autenticidad de la liberación de cuarentena. El Notario registra informe externo separado, validador, fecha, resultado y versión privada del informe. Favorable significa **declaración no verificada**, nunca validación criptográfica del ERP. Cargo exige esa evaluación favorable de la huella exacta y versión privada del cargo, fecha y referencia. Todo queda declarado, no verificado; el sistema no afirma envío, aceptación, inscripción ni firma válida real. Permite documentar un trabajo hecho fuera, no ejecutarlo ni homologarlo. Una nueva versión de archivo requiere nuevo registro.

Ambos flujos conservan un cargo único y seguimiento observado/subsanado/inscrito/tachado/desconocido vinculado a su evento exacto. Estados terminales conservan carácter simulado/declarado. No se permite retroceder la fecha respecto al hito previo. Cambiar informe antes del cargo invalida el uso del informe anterior; después del cargo se conserva la evaluación congelada y un nuevo archivo/corrección exige otro registro. Sin automatización SID, firma remota, OCSP/CRL, TSA o comunicaciones externas.

BK-26 captura evidencia **declarada** de una demo hecha externamente, vinculada a UUID/hash de un XML SIM existente, con fecha/referencia/resultado/sustento. Aceptado declarado no equivale a CDR ni cambia `fiscal_projection`, saldos, cobros o series. No se ha ejecutado demo real. La conciliación efectiva del proveedor sigue pendiente del contrato/cuenta autorizados; el simulador existente conserva timeout/consulta/idempotencia como prueba local, sin habilitar emisor real.

## Permisos y reserva

Identidad/traslados reutilizan `procedure:read`; Caja no recibe contenido, recuentos, revisiones ni archivos del canal. Fiscal usa `fiscal:read`; Notario no adquiere acceso económico. Administración/Notario registra evaluación cuando tiene acceso al canal; constancias de firma/informe/cargo solo Notario como función local, sin presumir habilitación jurídica real. Lecturas y descargas auditadas. API exige sesión/TOTP, origen y sesión reciente en mutaciones. No se consulta PLAFT ni se replica su contenido o metadatos en este módulo. Sustentos de integración no deben contener información reservada PLAFT.

## Atomicidad

Orden: expediente cuando existe → estado de oficina/canal. Es compatible con bloqueo del procedimiento y permite verificar incidencia simultánea antes de agregar cargo. UUID/hash/actor/oficina impide repetir efectos o reutilizar solicitudes con otro cuerpo; respuesta confirmada precede al control de revisión. Eventos, manifiesto, revisión, solicitud y auditoría se confirman juntos. Fallo de auditoría revierte todo. Cadena SHA-256 verificada en lecturas; bytes del manifiesto y del archivo privado verificados antes del uso. Hash no es firma o anclaje independiente. No se escriben tablas de expedientes, procedimiento, dinero, fiscal o cumplimiento.

## Dependencias y fuentes

Consulta oficial puntual el 29/10/2026, sin iniciar sesión ni contratar servicios:

- [RENIEC, acceso a verificación de identidad](https://www.gob.pe/13543-solicitar-acceso-al-servicio-de-verificacion-de-identidad-de-personas-en-reniec): modalidades y solicitud de acceso. La búsqueda oficial devolvió el contenido; la apertura directa respondió 418. No acredita convenio de esta notaría ni compatibilidad de lector.
- [SUNARP, registro SID](https://www.gob.pe/institucion/sunarp/pages/27618-registrarse-en-el-sistema-de-intermediacion-digital-sid-de-la-sunarp): presentación electrónica y firma digital; contenido de búsqueda oficial, apertura directa 418. No demuestra canal API, habilitación del titular o actos de esta notaría.
- [SUNAT, pautas BETA](https://orientacion.sunat.gob.pe/12-pautas-servicio-beta): entorno de pruebas distinto de habilitación real. No se llamó al servicio BETA ni se transmitió XML alguno.
- [PostgreSQL 17, bloqueo explícito](https://www.postgresql.org/docs/17/explicit-locking.html) y [Zod 4, contratos](https://zod.dev/api): consulta técnica frente a dependencias instaladas. Sin actualizar paquetes.

Los responsables operativos son roles propuestos, pendientes de designación nominal. Ver [matriz de habilitación](../phase-6/DEPENDENCIAS.md), [entrega](../phase-6/ENTREGA.md) y [evidencia](../evidence/fase-6.md). No se declara fase 6 real completada, homologación jurídica, piloto o emisión SUNAT.

# Fase 4 · Caja y cuentas por cliente

NotariaOS 0.4.0 · 29/10/2026 · entrega para revisión local. Una notaría, estética ELDIAL/Clix negra y azul, Montserrat y navegación superior conservadas.

Este corte materializa caja, cobros, anticipos, gastos, proveedores, fondos de terceros y cuenta por cliente solicitados por André. Se apoya en los expedientes y presupuestos persistentes de [fase 3](../phase-3/ENTREGA.md). No declara completados todos los componentes fiscales y operativos del plan original.

## Cómo recorrerlo

1. Abrir `http://127.0.0.1:3100/acceso` con la cuenta propia y TOTP. Administración o Caja acceden a **Caja y cobros**. No se agregaron cuentas de prueba a la instalación de revisión.
2. Registrar persona y expediente con Administración/Recepción. En el presupuesto, registrar su aceptación. Esto todavía no mueve dinero ni genera deuda.
3. En Caja, **Cargo de presupuesto** traslada explícitamente Honorarios/Otros del presupuesto aceptado vigente. Excluye Terceros; el cargo se registra una sola vez y no se puede duplicar por reintentos. Otra opción es **Cargo manual**, con detalle.
4. **Abrir caja** declara efectivo inicial. Las siguientes aperturas toman el último conteo. Administración puede declarar reposición física explícita y su motivo, sumada al conteo; Caja no puede hacerlo. El sistema impide abrir si el efectivo no cubre fondos de terceros en custodia.
5. **Registrar cobro** selecciona cliente, expediente, cargo, importe parcial, medio y referencia. Transferencia/tarjeta quedan separadas del efectivo. Toda entrada/salida exige caja abierta.
6. **Recibir anticipo** crea saldo disponible sin reducir deuda. **Aplicar anticipo** vincula ese origen con un cargo del mismo cliente y expediente, sin otro ingreso de caja. **Devolver anticipo** limita la salida al saldo no aplicado.
7. En **Proveedores**, crear la ficha. Antes de un gasto, cargar su sustento privado en Documentos y liberar la versión con el perfil autorizado. En **Gastos y terceros**, Administración autoriza importe, proveedor, clasificación, vencimiento y sustento. Registrar uno o varios pagos hasta el saldo autorizado. Recuperar un gasto propio del cliente es un cargo separado, explícito y único.
8. **Recibir fondo de terceros** registra custodia, sin deuda ni ingreso propio. **Pagar con fondo de terceros** exige origen disponible y gasto autorizado para terceros, del mismo cliente/expediente/medio. Se puede devolver el remanente. No puede pagarse un gasto propio invadiendo el efectivo de terceros.
9. **Estado de cuenta** reúne los expedientes del ID de la persona. Muestra deuda, anticipos, fondos de terceros y obligaciones separadas, sin netearlas automáticamente ni unir clientes que comparten nombre. El historial tiene paginación y constancia interna de cada movimiento con identidad de ese momento.
10. **Conciliación** vincula movimientos bancarios y referencias únicas de línea de extracto. Administración puede retirar la conciliación dejando motivo e historial. Es cotejo manual, no conexión bancaria.
11. **Cerrar caja** guarda efectivo esperado, contado, diferencia, motivo y responsable. Conserva cierres anteriores incluso si después se corrige un registro. Los movimientos monetarios posteriores requieren nueva apertura. Historial de sesiones muestra las últimas 20; movimientos tienen paginación.

## Correcciones y permisos

Los registros no se editan ni eliminan. Administración usa **Revertir**, primero sobre aplicaciones/pagos/recuperaciones dependientes y luego sobre el origen. Una conciliación vigente debe retirarse antes. Un reverso monetario se refleja en la caja actualmente abierta y respeta disponibilidad; no envía dinero a una entidad bancaria. Una devolución real se registra como devolución. El texto del formulario se conserva ante revisión desactualizada y permite **Actualizar contexto sin cerrar**.

| Función | Administración | Caja | Recepción / Abogado / Notario |
| --- | --- | --- | --- |
| Lectura financiera / cuenta por cliente | Sí | Sí | No |
| Apertura/cierre, cobros y anticipos | Sí | Sí | No |
| Proveedores, cargos y pagos autorizados | Sí | Sí | No |
| Autorizar gasto, revertir o conciliar | Sí | No | No |
| Reponer fondo al abrir | Sí | No | No |
| Contenido jurídico desde el módulo de caja | Según permiso jurídico separado | No | Según su permiso jurídico |

Mutaciones financieras requieren sesión con segundo factor de hasta 15 minutos; al vencer, iniciar sesión nuevamente. Los permisos y alcance de oficina se comprueban en servidor. Los importes viajan como cadenas decimales y se calculan en céntimos exactos. Política de roles explícita, sin autorización notarial implícita por tener administración.

## Comparación y trazabilidad

Los antecedentes de Adiasoft y Eureka se incorporan mediante BK-33 a BK-36: presupuesto relacionado con cargo, gastos por expediente, proveedores/pagos parciales y estado consolidado. El diseño visual sigue ELDIAL. Véanse [comparativa](../phase-1/comparativa-mercado.md), [backlog ampliado](../phase-1/backlog-ampliado.md) y [ADR 0004](../adr/0004-caja-y-cuentas-persistentes.md).

| Historia | Resultado en este corte | Pendiente concreto |
| --- | --- | --- |
| BK-18 | Cargos, cobros, anticipos, aplicaciones, devoluciones y decimal exacto | Tarifario administrable y tratamiento tributario validado |
| BK-19 | Constancia interna separada de emisión tributaria | Contrato fiscal XML/QR, adaptador simulado y proveedor real en su habilitación |
| BK-20 | Apertura/cierre, diferencias, reposición explícita, reintentos idempotentes y conciliación manual | Bancos reales, retiros/remesas, varias cajas/cuentas y prueba operativa |
| BK-33 | Cargo explícito del presupuesto aceptado, sin duplicar ni cargar Terceros | Tarifario y emisión fiscal |
| BK-34 | Gasto autorizado, sustento privado versionado, clasificación, pagos parciales y recuperación explícita | Política contable/tributaria y controles operativos aprobados |
| BK-35 | Proveedores, obligaciones, vencimientos, pagos y cotejo manual | Integración/importación bancaria y cuentas por entidad |
| BK-36 | Cuenta por ID a través de expedientes autorizados, saldos reproducibles y separados | Exportación autorizada y piloto con permisos/reserva revisados |

## Persistencia y resguardo

Migración 005 aditiva a 001–004. Historial financiero, solicitudes idempotentes, proveedores, aperturas/cierres y conciliaciones protegidos contra UPDATE/DELETE. Registro, auditoría, revisión y respuesta idempotente se confirman juntos. El bloqueo por oficina evita sobreaplicaciones concurrentes en este modelo de una notaría.

Base principal `.notaria/` privada; QA usa directorios `.notaria-phase4-qa-*` independientes. PGlite tiene un solo proceso propietario: detener servidor antes de copiar/restaurar. Copia previa a actualizar: `backups/local-2026-10-29T08-09-57-108Z`. Las cuentas, claves y TOTP no se incluyen en documentación ni evidencia. Los respaldos siguen privados e ignorados.

## Validación y límites

Resultados y capturas: [evidencia fase 4](../evidence/fase-4.md). Se ejecutan compilación, TypeScript/lint, pruebas unitarias, suite integrada de API/navegador y verificaciones de integridad/recuperación; los resultados finales constan en esa evidencia.

Entorno local de revisión. PEN solamente; las constancias son internas. No hay liquidación tributaria, comprobantes SUNAT, pago enviado a bancos, saldo bancario certificado ni mayor contable. No se conectaron RENIEC/SUNAT/SUNARP/firma/proveedores. PostgreSQL de servicio, cifrado/antivirus gestionados, carga, recuperación operativa, reserva y revisión jurídica/contable siguen pendientes antes del piloto. Plantillas jurídicas, otorgamientos y numeración instrumental mantienen su corte específico pendiente de fase 3.

No se crea saldo inicial de clientes por importación ni traspasos entre clientes, expedientes o medios. Un faltante de arqueo no extingue la custodia: debe investigarse y reponerse físicamente con registro de Administración. Los catálogos/partidas abiertas se cargan completos en este entorno de una notaría; el historial sí está paginado y requiere evaluación de volumen antes de operar.

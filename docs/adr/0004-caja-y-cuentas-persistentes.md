# ADR 0004 · Caja, cuentas y custodia separadas

Estado: implementado para revisión local, 29/10/2026. Alcance autorizado: una notaría; fase 4 solicitada por André. Conserva la identidad ELDIAL/Clix negra y azul, Montserrat, acceso y navegación existentes.

## Decisión

La migración 005 agrega un registro financiero inmutable. Cada entrada conserva persona por ID, expediente, instantánea de identidad, importe decimal, responsable, fecha y vínculos al origen/destino. Las correcciones son compensaciones; no se editan ni borran entradas. PostgreSQL `numeric(14,2)` y cadenas en la API; BigInt en céntimos para aritmética. No se convierten importes a Number.

Un bloqueo de `finance_state` por oficina serializa mutaciones financieras. Se comprueban revisión, permiso, origen, sesión reciente y TOTP; solicitud UUID + huella canónica + actor impiden repetir efectos. Registro, revisión, secuencia, auditoría y resultado idempotente se confirman en una transacción. Una petición repetida idéntica devuelve su resultado anterior incluso si la revisión avanzó; reutilizarla con otros datos o actor devuelve 409.

Se mantienen cuatro magnitudes independientes: deuda por cargos propios, anticipos pendientes de aplicar/devolver, custodia de terceros y obligaciones con proveedores. El estado de cuenta suma todos los expedientes del ID seleccionado, sin unir personas por nombre ni compensar automáticamente saldos. Caja recibe identidades mínimas y referencias administrativas; no recibe asuntos, borradores ni acceso jurídico o a documentos privados.

## Reglas

- Aceptar presupuesto no produce cobro ni deuda. Traslado explícito de la versión aceptada vigente a un cargo; incluye Honorarios/Otros y excluye Terceros. Solo un cargo de presupuesto activo por expediente. Para trasladar otra versión se corrigen primero cargo y aplicaciones anteriores. La misma versión no se importa nuevamente tras revertirla; una corrección adicional usa cargo manual trazable.
- Cargo manual y recuperación de gasto son acciones explícitas. Una recuperación se vincula una sola vez al gasto propio y no supera su importe autorizado. El gasto y su pago no incrementan deuda del cliente por sí solos.
- Cobro parcial se aplica a un cargo; anticipo se recibe sin reducir deuda y posteriormente se aplica a un cargo del mismo cliente/expediente. Aplicación no mueve dinero. Devolución limitada al anticipo no aplicado. No hay sobreaplicaciones ni saldos negativos autorizados.
- Fondos de terceros tienen origen propio; solo pagan obligaciones autorizadas para terceros o se devuelven. Mismo cliente, expediente y medio del fondo original. Salidas propias en efectivo no pueden invadir el efectivo de terceros. No se implementan traspasos entre medios ni entre clientes/expedientes.
- Administración autoriza gastos con proveedor, clasificación, vencimiento y versión privada liberada de un interviniente del caso. Caja registra pagos parciales; la ficha del proveedor y el sustento quedan en la instantánea. La clasificación/importe de una autorización se corrigen con reverso si aún no tienen dependencias activas.
- Toda entrada/salida requiere caja abierta, incluso transferencia/tarjeta. Arqueo solo suma efectivo; bancos no aumentan efectivo físico. Una apertura activa, cierre inmutable con esperado/contado/diferencia y motivo; siguiente apertura coincide con el último conteo más reposición explícita de Administración. La reposición conserva importe, conteo anterior, responsable y motivo; no es un ingreso ni deuda de cliente. Si un faltante no cubre custodia de terceros, la nueva apertura exige reposición suficiente. No hay reapertura de un cierre histórico ni ajuste silencioso.
- Reverso monetario se registra en caja actual, respeta disponibilidad y conserva el cierre anterior. No se revierte una entrada con aplicaciones/pagos/recuperación activos, una entrada ya revertida o una conciliación vigente. Revertir no envía dinero al banco: corrige el registro interno de una operación documentada; una devolución real usa su comando específico.
- Referencia externa única por oficina/medio para movimientos no efectivos; se conserva incluso tras corrección. Conciliación manual identifica movimiento y línea única de extracto; retiro de conciliación también inmutable. No hay conexión ni importación bancaria automática.
- Administración: lectura, registro, autorización, reverso y conciliación. Caja: lectura financiera, aperturas/cierres, proveedores, cargos, cobros, anticipos y pagos de obligaciones autorizadas. Recepción/Abogado/Notario no reciben acceso financiero por su función jurídica; Administración tampoco recibe autorización notarial.

## Implementación y límites

`src/lib/finance-domain.ts`, `src/server/finance-schema.ts`, `src/server/finance.ts`, `/api/finance`, `src/components/finance-pages.tsx`. Las seis vistas de Caja usan los mismos componentes y tokens ELDIAL, tabla desplazable accesible, formularios que preservan texto al actualizar contexto y constancia interna consultable. Historial y estado de cuenta paginados; catálogos y partidas abiertas completos para seleccionar orígenes/destinos en esta instalación local. Historial de sesiones muestra últimas 20.

PEN solamente. No hay mayor contable, cálculo/liquidación de impuestos, factura/boleta SUNAT, tarifario administrable, contrato fiscal XML/QR ni proveedor fiscal simulado en este corte. Las constancias son control interno. Tampoco conexión bancaria, pagos enviados, transferencias entre medios, retiros/remesas de caja, saldos iniciales importados de clientes ni cuentas bancarias por entidad. Un faltante de arqueo exige investigación y no extingue deuda/custodia. Saldo bancario disponible debe verificarse externamente; el sistema limita saldos de cliente/obligación, no afirma disponibilidad bancaria.

Adiasoft y Eureka aportaron comparación funcional: presupuestos, gastos por trámite, proveedores, terceros y cuenta consolidada (BK-33 a BK-36). No se incorporan sus diseños, código, afirmaciones fiscales ni integraciones.

## Fundamento técnico consultado

- [PostgreSQL: bloqueos de filas](https://www.postgresql.org/docs/current/explicit-locking.html): exclusión entre mutaciones sobre una misma oficina.
- [PostgreSQL: numeric](https://www.postgresql.org/docs/current/datatype-numeric.html): precisión exacta para importes.
- [Kysely: transacciones](https://kysely.dev/docs/examples/transactions/simple-transaction): excepción revierte el conjunto transaccional.

La implementación y sus pruebas se describen en [la entrega](../phase-4/ENTREGA.md). Estas fuentes sustentan elecciones técnicas, no una certificación financiera o legal.

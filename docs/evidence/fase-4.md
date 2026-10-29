# Evidencia ejecutada · fase 4

29/10/2026 · NotariaOS 0.4.0. Base aislada final `.notaria-phase4-qa-04`. No se introdujeron cuentas QA ni movimientos sintéticos en `.notaria/`. ElDial se mantuvo solo como referencia de lectura.

## Resultado

- Compilación Next, TypeScript y ESLint correctos. 18 pruebas unitarias correctas.
- [30 pruebas de navegador/API correctas](fase-4-e2e.json), aproximadamente 1,5 minutos. Incluyen regresión de autenticación/TOTP/recuperación, personas, archivos privados, expedientes, versiones y presupuestos, y 11 escenarios financieros. La suite respeta el límite de autenticación por IP y espera una ventana cuando recibe 429; no se relajó el control.
- [12 grupos de controles de integridad correctos](fase-4-integridad.json), ejecutados sobre original y sobre restauración CLI aislada: siete tablas inmutables; imposibilidad de editar entradas; aislamiento de oficina; cliente ajeno 404; fallo deliberado de auditoría revierte cargo/revisión/secuencia/solicitud; fallo de auditoría revierte cierre; saldos de cliente no negativos; totales iguales al registro; cierres reconstruibles; un cargo de presupuesto vigente por caso; restauración conserva conteos y decimales. [Resultado de origen](fase-4-integridad-origen.json).
- Copia previa de revisión creada con servidor detenido. Copia QA real creada y restaurada mediante scripts CLI, checksum validado y destino nuevo sin sobrescritura. El mismo verificador se ejecutó sobre la copia restaurada.

## Cobertura financiera

Permisos Administración/Caja, sesión sin MFA rechazada, API sin sesión 401, origen ajeno 403; Caja sin lectura de contenido jurídico o fichas/documentos generales. Clientes de igual nombre separados por ID.

Aceptación no crea dinero; cargo explícito de presupuesto exacto y excluye Terceros; petición simultánea idéntica devuelve un único resultado y misma clave con otros datos se rechaza. Caja cerrada bloquea flujos. Apertura única, cobro parcial, anticipo separado, aplicación/devolución, límites de saldo y referencia bancaria duplicada rechazados. No se puede aplicar a otro expediente ni cliente.

Proveedor único, autorización exclusiva de Administración, sustento válido obligatorio, gasto de terceros financiado por su origen y medio, pagos parciales y devolución del remanente. Gasto y egreso no se convierten automáticamente en cargo; recuperación explícita única. Dos aplicaciones concurrentes sobre una revisión producen un solo efecto. Original y reverso conservados; dependencias, doble reverso y conciliación vigente bloquean correcciones incompatibles. Línea de extracto única, retiro de conciliación inmutable y nuevo cotejo documentado.

Cuenta a través de varios expedientes con centavos exactos, paginación y saldos separados. Cierre con esperado/contado/diferencia, continuidad del conteo, corrección posterior sin alterar cierre anterior, protección de custodia y reposición explícita exclusiva de Administración. Interfaz: cargo, conflicto conservando texto, actualización de contexto, cobro aplicado, constancia y recarga persistente; seis vistas financieras sin errores de página.

## Inspección visual

Capturas con datos ficticios, sin secretos: [1440 px](fase-4-caja-1440.png), [683 px](fase-4-caja-683.png), [390 px](fase-4-caja-390.png) y [oscuro](fase-4-caja-oscuro.png). Inspeccionadas directamente en escritorio, móvil y oscuro: tipografía/encabezado ELDIAL, negros/azules, tarjetas, tablas y formularios coherentes. Tablas anchas se desplazan dentro de una región accesible, sin desbordamiento global.

Axe no detectó violaciones en las vistas y modal financiero cubiertos, además de la regresión de personas, presupuesto y acceso; no es certificación completa WCAG. Reflujo verificado en 1440/683/390; navegación por teclado y movimiento reducido incluidos.

## Resguardo y límites

Respaldo principal anterior a migración 005: `backups/local-2026-10-29T08-09-57-108Z`. Respaldo QA: `backups/local-2026-10-29T08-27-37-326Z`; destino `.notaria-phase4-restaurada-qa-04`. No se abrieron secretos en salidas ni se sobrescribieron directorios. QA quedó detenido; revisión local en 3100 con su propia base.

Las pruebas no establecen conformidad tributaria/contable, disponibilidad bancaria, prueba de carga, operación con varios procesos, PostgreSQL gestionado, RPO/RTO o autorización legal. Véanse [alcance y pendientes](../phase-4/ENTREGA.md) y [ADR 0004](../adr/0004-caja-y-cuentas-persistentes.md). No hubo publicación, PR, conexión bancaria/fiscal ni envío de pagos.

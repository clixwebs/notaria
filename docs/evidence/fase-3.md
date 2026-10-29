# Evidencia de fase 3

29/10/2026 · NotariaOS 0.3.0 · Node 24.20.0 / Next 16.4.3 · Windows local.

## Verificaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Build | Correcto; rutas dinámicas de expedientes y API |
| TypeScript / lint | Correctos, sin errores ni advertencias finales |
| Unitarias | 15 correctas: reglas previas y presupuesto decimal/perfiles/validación |
| Navegador / HTTP | 19 correctas en 17,2 s; [reporte](fase-3-e2e.json) |
| Integridad / recuperación | 11 controles correctos; [reporte](fase-3-integridad.json) |
| Instalación de revisión | Acceso disponible en 3100; API nueva devuelve 401 sin sesión |

La suite vigente conserva las verificaciones de fundamentos y añade los escenarios de `phase3.scenarios.ts`. Los antiguos recorridos sintéticos del prototipo no se ejecutan como si fueran operaciones persistentes.

## Lo demostrado

- Alta de expediente repetida con la misma clave produce un solo recurso; contenido distinto recibe conflicto.
- Seis creaciones paralelas reciben referencias internas distintas, con restricciones únicas en la BD.
- Requisitos por acto: cuatro orientativos para compraventa y dos para certificación/carta.
- Actualizar Personas no modifica la instantánea del expediente ni la de un borrador previo.
- Requisito ajeno rechazado; archivo en cuarentena rechazado; archivo liberado vinculado a un interviniente admitido.
- Dos cambios con la misma revisión: uno confirma, el otro recibe conflicto. Se conservan los resultados/observaciones de revisión en un historial inmutable específico.
- Administración no puede registrar revisión profesional; Abogado sí. Una versión nueva o cambio de contexto invalida la revisión vigente; no se revisa una versión histórica como si fuera actual.
- El texto de borrador conserva los caracteres de un script como texto; no se ejecutan en el navegador. Las huellas se reconstruyen con serialización canónica del texto/contexto.
- Presupuesto exacto: `0.10 × 3 + 0.20 = 0.50`; se rechazan fracciones extra, propuestas vencidas y campos financieros no previstos.
- Aceptación sobre la última versión: crea/actualiza una orden estable, conserva aceptaciones anteriores y no añade pagos ni actuación.
- Tareas/observaciones, búsqueda, filtros y paginación en servidor consultan datos persistentes.
- UI completa: alta de carta, revisión de requisito, borrador, presupuesto y aceptación; recarga conserva lo guardado.
- Conflicto con formulario abierto: conserva texto, permite actualizar contexto y guardar otra versión.
- Acceso directo sin sesión o desde perfil Caja rechazado. Revocación y recuperación de fundamentos siguen funcionando.

## Integridad y restauración

Con QA detenida, el script SQL comprobó que no se modifican instantáneas, historial de requisitos, borradores, presupuestos, aceptaciones o eventos. Se invocó el caso de uso real de observación bajo un fallo deliberado de auditoría: no se confirmaron nota, revisión del expediente ni evento parcial.

Un actor de otra oficina no pudo leer el expediente; su lista resultó vacía. La copia restaurada conservó los conteos de 14 tablas, incluidos 9 expedientes, 32 requisitos, 6 revisiones de requisitos, 3 borradores, 4 presupuestos y 3 aceptaciones. Coincidieron las huellas de borradores. Se ejecutaron también los comandos CLI de copia/restauración y la comprobación sobre el directorio restaurado.

La instalación principal se respaldó antes de aplicar las migraciones aditivas 003–004. Las cuentas/fichas QA solo se crearon en `.notaria-phase3-qa-*`; las copias y directorios privados están excluidos de Git.

## Interfaz revisada

Se conservaron login, Montserrat, estructura ELDIAL/Clix, barra negro tinta y acciones azules. Se inspeccionaron las capturas de [presupuesto escritorio](fase-3-presupuesto-1440.png), [reflujo](fase-3-presupuesto-683.png), [móvil](fase-3-presupuesto-390.png) y [oscuro](fase-3-presupuesto-oscuro.png).

Axe no detectó infracciones en los estados de personas/presupuesto a 1440/683/390 px, oscuro móvil y acceso a 1440/390 px. Sin desbordamiento global en esos estados. Pestañas desplazables muestran la activa; tablas anchas permiten desplazamiento con teclado. No representa una certificación WCAG completa ni prueba real de zoom.

Durante la validación se corrigió un selector de prueba de combobox: el control sí tenía nombre accesible, pero el localizador textual exacto incluía opciones. Se ajustó también el reflujo del encabezado del presupuesto y la presentación de la orden en móvil. Los fallos previos no se contabilizan como pruebas correctas.

## Límites del corte

Borrador/revisión de preparación y presupuesto/orden administrativa implementados. Plantillas con variables, identificación, otorgamientos, numeración instrumental, diligencia y entrega persistentes conservan su siguiente corte. Caja/facturación y gastos/terceros/cuenta consolidada corresponden a fase 4. No se conectaron proveedores ni se publicó el sistema.

No se ensayó PostgreSQL gestionado, carga operativa, varios procesos sobre PGlite, recuperación por correo, antivirus o RPO/RTO. Siguen aplicando los límites de infraestructura, seguridad y validación jurídica de fase 2. No se modificaron las referencias ElDial.

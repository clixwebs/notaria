# Comparativa de producto y actualización del plan

29/10/2026. Solicitud de André: leer y reutilizar la interfaz/código de ElDial; comparar el producto con Adiasoft y Eureka, integrando mejoras útiles. Alcance: **una notaría peruana**. La identidad común de Clix no implica desarrollar ahora un SaaS para múltiples notarías.

## Resultado

El objetivo es un ERP con dos partes igualmente importantes: el procedimiento notarial y la administración económica de la oficina. El plan inicial desarrollaba con mayor detalle la primera. Se amplía la segunda con presupuestos, gastos por expediente, obligaciones frente a terceros y cuenta consolidada del cliente. La interfaz debe conservar la familia visual de ElDial.

## Fuentes y alcance de la observación

| Fuente oficial | Evidencia consultada | Límite |
| --- | --- | --- |
| [Adiasoft, portada](https://www.adiasoft.com/) | Catálogo y posicionamiento general | Página comercial; no demuestra funcionamiento interno |
| [Adiasoft, abogados y notarías](https://www.adiasoft.com/sistema-para-abogados-y-notarias) | Funciones sectoriales y preguntas frecuentes | Afirmaciones del proveedor, sin sesión ni prueba contratada |
| [Eureka, notarías y despachos](https://eureka.lat/erp-para-notarias-despachos-legales) | Oferta sectorial publicada | Sin evaluación técnica, contrato ni demo privada |
| ElDial local | Código de login, formulario, video, tema, fuentes, navegación, componentes y capturas | Inspección estática; no se ejecutó ni modificó el proyecto de referencia |

Solo se consultaron páginas públicas. No se pidieron cotizaciones, crearon cuentas ni contactaron proveedores. «No descrito» significa que la página revisada no lo detalla; no demuestra que el producto carezca de esa función. El precio, disponibilidad, calidad y seguridad no fueron comprobados mediante uso del servicio.

## Matriz comparativa

Adiasoft se presenta como ERP multirubro configurable; Eureka publica una propuesta de gestión para oficinas legales. Las siguientes celdas sintetizan exclusivamente su oferta pública. [Adiasoft sectorial](https://www.adiasoft.com/sistema-para-abogados-y-notarias), [Eureka sectorial](https://eureka.lat/erp-para-notarias-despachos-legales).

| Capacidad | Adiasoft: publicado | Eureka: publicado | NotariaOS hoy | Objetivo del desarrollo |
| --- | --- | --- | --- | --- |
| Expedientes y seguimiento | Casos y actuaciones | Trámites | Demo navegable | BK-13; reglas por acto y control de pendientes |
| Kardex e instrumentos | Kardex notarial | No detallado | Referencia interna demo | BK-16; series/folios y control concurrente |
| Agenda y diligencias | Agenda/plazos | No detallado | Agenda de muestra; intentos demo | BK-17/27; citas y resultados distinguibles |
| Cotización | Cotizaciones/honorarios | Cotizaciones/impuestos | Pendiente | BK-33; presupuesto versionado y aceptado |
| Cobranza y cuenta | Cobranza/cuotas | Balance del cliente | Cobros por expediente demo | BK-18/20/36; anticipos, aplicaciones y consolidado |
| Gastos y terceros | Tesorería/contabilidad | Gastos y pagos | Pendiente | BK-34/35; egresos y obligaciones trazables |
| Bancos | Caja/bancos | Cuentas contables/bancos | Pendiente | BK-20/35; conciliación con evidencia |
| Horas y costos | Horas facturables | No detallado | Pendiente | BK-37 opcional; medir costo y carga de trabajo |
| Clientes y portal | CRM/portal | Historial cliente | Directorio demo; portal previsto | BK-28/36; vista por relación y reserva |
| Documentos | Adjuntos/modelos | No detallado | Documento de muestra y versiones demo | BK-10/14; archivos privados y revisión por versión |
| Facturación | Electrónica | CFDI/papel | Rotulada como simulación | BK-19/26; SUNAT y proveedor autorizado |
| Permisos y evidencia | Roles/auditoría | Seguridad anunciada | Sin seguridad operativa | BK-08/11; denegación en servidor y auditoría durable |

Adiasoft declara en sus FAQ que aún no conecta SID-SUNARP, no firma digitalmente escrituras ni calcula automáticamente plazos por proceso. No se promete que nuestro prototipo ya resuelva esas capacidades: son dependencias de BK-24/25 y de validación profesional. [FAQ del proveedor](https://www.adiasoft.com/sistema-para-abogados-y-notarias).

La referencia a CFDI en Eureka exige revisar su aplicabilidad territorial; no prueba integración con SUNAT. Su mención de bancos tampoco permite inferir conectores bancarios concretos. [Oferta de Eureka](https://eureka.lat/erp-para-notarias-despachos-legales).

## Cambios concretos al alcance

### Presupuesto y orden del trámite

Antes de registrar pagos, ofrecer un presupuesto que identifique acto, conceptos, responsable, vigencia y condiciones. Conservar la versión aceptada. Una corrección posterior debe quedar vinculada; la aceptación no autoriza el acto notarial. Los importes ficticios del prototipo no constituyen tarifas.

La orden del trámite enlaza el presupuesto con el expediente. Un anticipo se registra una vez y se aplica a los cargos pertinentes. No volver a cobrar ni reconocer ingresos al cambiar de pantalla o emitir el comprobante.

### Gastos, fondos del cliente y terceros

Modelar por separado el cargo por servicio, la obligación de pago, el egreso y su eventual recuperación. Cada gasto puede vincularse a expediente, proveedor/tercero, autorización y sustento. La clasificación tributaria y contable se validará con el responsable correspondiente; no se decidirá automáticamente por el nombre del concepto.

Soportar importes parciales, devoluciones, anulaciones mediante compensación y conciliación. Si la notaría utiliza fondos destinados a terceros, mantener su destino y saldo identificables; no confundirlos con honorarios. La política exacta se valida con la oficina.

### Cuenta consolidada del cliente

Mostrar expedientes permitidos, cargos, anticipos, pagos aplicados, devoluciones y saldos. Poder llegar desde un total hasta el movimiento y su sustento. Resolver primero identificación de persona, titular de pago y permisos; un nombre coincidente no autoriza mezclar cuentas.

### Indicadores útiles para la notaría

Priorizar tiempo por etapa, expedientes observados, devoluciones para corrección, carga por responsable, entregas pendientes, saldos por antigüedad y egresos sin sustento. Cada indicador debe mostrar periodo, denominador y enlace al conjunto que lo origina. Separar actividad registrada de rendimiento profesional y no publicar comparaciones de empleados sin política aprobada.

### Portabilidad, soporte y uso asistido de IA

Prever importación ensayada, exportación autorizada del expediente con versiones/evidencias y documentación de salida. El soporte necesita guías por función y procedimientos de recuperación. Una exportación no equivale a cumplir por sí sola con las obligaciones de archivo notarial.

Si se amplía a OCR o asistencia de redacción, utilizar propuestas editables con revisión humana y trazabilidad al documento original. No otorgar facultades notariales a un modelo ni enviar datos reservados a servicios sin habilitación. Este trabajo es opcional y posterior al núcleo.

## Diferenciación que sí podremos demostrar

Estas son metas propias, no afirmaciones de exclusividad frente a otros proveedores:

1. Unir requerimiento, interviniente, representación, versión revisada y actuación sobre el mismo expediente.
2. Explicar cada bloqueo y distinguir error técnico de una no coincidencia de identidad.
3. Mantener el documento autorizado y su evidencia frente a cambios posteriores de fichas o plantillas.
4. Recorrer cada total financiero hasta cargos, aplicaciones, compensaciones y sustentos.
5. Mantener separadas preparación, firma, presentación, cargo de recepción y resultado externo.
6. Gestionar reserva y necesidad de acceso desde el servidor, incluyendo descargas y metadatos.
7. Medir recuperación, concurrencia e idempotencia mediante pruebas, además de revisar pantallas.
8. Mantener la misma interfaz de la familia Clix/ElDial para reducir aprendizaje.

No se anuncia que NotariaOS supere a un producto en producción. Para compararlo de forma verificable se necesitarían demos autorizadas, escenarios equivalentes, resultados y costos reales.

## Criterios para una demostración futura de proveedores

La siguiente lista es una pauta de evaluación; no se enviará a nadie sin indicación de André:

- Caso completo con observación, cambio documental y subsanación.
- Anticipo parcial, gasto asociado, recuperación, devolución y saldo del cliente.
- Doble solicitud de pago y estado incierto de un proveedor.
- Acceso de un usuario sin permiso a un archivo por URL directa.
- Demostración del canal de identidad/firma/presentación que se ofrezca para Perú.
- Exportación del expediente y restauración de una copia aislada.
- Condiciones de migración, soporte, almacenamiento, salida de datos y costos por uso.

## Orden de desarrollo actualizado

1. Cerrar el prototipo con estética ElDial y sus recorridos sintéticos.
2. Implementar núcleo seguro: identidad de usuarios, permisos, persistencia, archivos privados y auditoría.
3. Incorporar expediente, presupuesto aceptado y requisitos/documentos.
4. Completar la cuenta económica: cargos, anticipos, gastos, terceros, comprobantes y conciliación.
5. Desarrollar cumplimiento e integraciones autorizadas; conservar sus dependencias reales.
6. Extender portal, indicadores, costos internos, portabilidad y soporte según prioridades.

Detalle de las historias nuevas: [ampliación del backlog](backlog-ampliado.md). El backlog original conserva sus identificadores y su carácter de planificación; las comparativas comerciales no sustituyen la validación jurídica de los procedimientos.


## Actualización de ejecución · Fase 2

El núcleo de personas, archivo privado, sesiones/TOTP, permisos y auditoría tiene implementación local. La columna «hoy» de la matriz anterior describe el corte de fase 1. La interfaz conserva los componentes ELDIAL/Clix y cambia a negros/azules por instrucción posterior de André. [Entrega vigente y secuencia integrada](../phase-2/ENTREGA.md).

BK-33 entra en fase 3 con el expediente; BK-34 a BK-36 son parte del mínimo financiero de fase 4. Los indicadores/portal y capacidades opcionales conservan su prioridad posterior. Esta actualización no equivale a haber implementado las funciones financieras nuevas.


## Actualización de ejecución · Fase 3

El expediente, requisitos, borradores/revisión, presupuestos versionados, aceptación comunicada y orden administrativa ya son persistentes en el entorno local. Se conserva la familia ELDIAL/Clix negra y azul. La oferta económica comparada se incorpora mediante BK-33, manteniendo gastos, terceros y cuenta consolidada de BK-34–36 para fase 4. [Entrega y límites actuales](../phase-3/ENTREGA.md). No implica haber probado los productos de los proveedores ni superar sus servicios operativos.

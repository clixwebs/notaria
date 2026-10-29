# Fase 5 · Cumplimiento

NotariaOS **0.6.0**, 29/10/2026. Una entrega integrada de **BK-21, BK-22 y BK-23**, sin subfases. ERP para una sola notaría, estética ELDIAL/Clix, Montserrat, negro tinta/azul, navegación superior, oscuro y móvil conservados.

## Recorrido

1. En Más → Cumplimiento, **Notario** accede a PLAFT reservado. Administración recibe acceso denegado sin registros ni recuentos; puede usar la pestaña Privacidad. Caja/Recepción/Abogado no reciben ninguno de los dos permisos.
2. PLAFT → Registrar actuación → Diligencia y riesgo. Elegir expediente y persona participante, fecha de operación, importe PEN exacto, origen de fondos, beneficiario final, PEP declarado, señales, riesgo y próxima revisión.
3. Agregar **Revisión humana** a la diligencia: seguimiento/cerrado/escalar, fundamento y siguiente revisión. No genera ROS ni comunica a terceros.
4. Privacidad → Notario publica **Finalidad y política**: código, base, aviso, necesidad de consentimiento, fuente, conservación y calendario/plazos ARCO/feriados. Catálogo vacío inicialmente; reutilizar código crea versión nueva. Los números del formulario son orientativos para revisión, no una política operativa activada por defecto.
5. Administración o Notario registra **Tratamiento y aviso**, elige persona y última versión, comunica aviso y conserva evidencia. El consentimiento requerido no puede omitirse. Retiro posterior se registra sin borrar historia ni afectar otras finalidades.
6. Registrar **Solicitud ARCO**, alcance y fecha de recepción. El sistema conserva política y plazo. Verificar identidad/legitimación antes de respuesta con evidencia y fecha de entrega. La ampliación justificada se comunica una sola vez y dentro del plazo, salvo información. El procedimiento operativo de subsanación/suspensión requiere validación específica.
7. Registrar **Conservación y bloqueo** con persona, categoría, expediente opcional y fecha de revisión opcional. La fecha no levanta el bloqueo. Solo Notario puede levantarlo con fundamento. Una cancelación no se marca totalmente atendida si hay bloqueo activo. Ninguna pantalla borra documentos, instrumentos o auditoría.
8. Registrar **Incidente** con conocimiento y medidas. Evaluar ANPD, titular y CNSD separadamente como aplica/no-aplica/pendiente, con hito y fundamento. Plazo orientativo desde el hito, no desde creación. Hitos de ANPD/CNSD parten del conocimiento registrado y no se reinician en revisiones. Guardar constancia de comunicaciones hechas externamente; cierre exige evaluaciones y constancias completas.
9. PLAFT → **Exportación local**: periodo, selección de diligencias revisadas y confirmación humana. Descarga JSON interno validado, con origen/historial/huellas congelados. Otra revisión no reescribe un archivo preparado. Preparar/descargar sigue **No presentado**. Cargo externo declarado se vincula a esa versión, sin fingir aceptación.
10. Consultar historial de cada registro. Formularios conservan texto ante conflicto; **Actualizar contexto conservando datos** es explícito. Escape cierra y devuelve foco. No existen cuentas ni registros QA en la instalación principal.

## Alcance y dependencias

La ingeniería local de las tres historias se entrega junta. [ADR0009](../adr/0009-cumplimiento-local-reservado.md) detalla permisos, cadena de integridad, conservación, concurrencia y límites. [Evidencia](../evidence/fase-5.md) registra las pruebas ejecutadas.

El formato **oficial SBS/OCP está deshabilitado**: requiere anexos vigentes, catálogos, calendario, reparto de responsabilidades y homologación. El contrato `notariaos-ro-review-v1` es una exportación interna de revisión, marcada expresamente; no sustituye el archivo regulatorio. Cumple la condición del plan de mantener formatos pendientes deshabilitados. No hay ROS automático, comunicación a ANPD/CNSD, borrado automático ni proveedores reales.

Responsables nominales, régimen PLAFT y políticas de privacidad/archivo de la notaría requieren revisión/aprobación operativa. Notario es custodio de ejercicio local, no acreditación de designación OCP. Sustentos se registran como texto reservado y referencias declaradas, sin adjuntos originales nuevos. No se acredita cumplimiento jurídico integral, firma ni anclaje independiente de auditoría. Los próximos trabajos del plan son integraciones de fase 6, condicionadas a convenios y autorización; **SUNAT real permanece deshabilitado**.

## Validación

Comandos: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`. La suite vigente es `playwright.phase5.config.ts`; integra toda la regresión anterior y cumplimiento, siempre contra QA nueva en3101. Detener/comprobar propietario Windows antes de verificadores/copias/restauración; nunca abrir una carpeta PGlite desde dos procesos.

Los resultados finales, carpetas QA y respaldo/restauración se registran en la evidencia de esta entrega. Los fallos iniciales se conservan y distinguen de la pasada final.

Cierre ejecutado: **47 unitarias y74 escenarios navegador/API correctos**, build/TypeScript/lint correctos;13 grupos de integridad en original/restaurada y46 tablas iguales con bytes privados. QA final `.notaria-phase5-qa-03` y restaurada detenidas; revisión3100 activa, sin cuentasQA. Memoria, decisiones, backlog y matriz normativa actualizados.

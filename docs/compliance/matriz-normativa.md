# Matriz normativa inicial

Revisión de planificación: 29/10/2026. **Ningún control está implementado por existir este documento.** El notario/asesor valida interpretación, aplicabilidad y textos consolidados; los responsables nominales aún no se conocen.

Estado técnico inicial conservado abajo. **Actualización fase 5 (0.6.0):** LEG-04/05/07/08/09/12 tienen controles locales de ejercicio implementados y probados según [ADR0009](../adr/0009-cumplimiento-local-reservado.md) y [entrega](../phase-5/ENTREGA.md). No están jurídicamente homologados: políticas/identidades responsables/anexos oficiales y operación real pendientes; formato oficial deshabilitado. Los estados de las filas describen la revisión jurídica inicial, no una ausencia de implementación técnica actual. Estado jurídico según fila: fuente revisada parcialmente, referencia identificada o pendiente. No equivale a validación profesional ni certificación de cumplimiento.

## 1. Controles y trazabilidad

| ID | Materia / norma-artículo | Supuesto y sujeto a validar | Control propuesto | Responsable propuesto | Evidencia y prueba | Revisión jurídica |
| --- | --- | --- | --- | --- | --- | --- |
| LEG-01 | Identidad: DL 1049 art. 55, texto DL 1232 [S1] | Notario/intervinientes y procedimiento aplicable | Resultado por participación/acto; métodos diferenciados y excepciones autorizadas | Notario + asesor | Transacción/método, constancia, excepción; AC-03/04 | Texto de modificación consultado; consolidación/aplicabilidad pendientes |
| LEG-02 | Función, registros e instrumentos: DL 1049 y modificatorias [S1] | Acto, registro y formalidad correspondiente | Requisitos/versiones, otorgamientos, autorización y numeración diferenciada | Notario + archivo | Versión autorizada, número/folio y trazabilidad; AC-05/06/07 | Artículos específicos y catálogo por verificar |
| LEG-03 | Importe RENIEC/IGV: Informe 030-2016-SUNAT/5D0000 [S2] | Emisor y servicio consultado | Concepto separado y regla tributaria aprobada | Responsable tributario | Comprobante y cálculo reproducible; AC-09 | Criterio consultado; revisión tributaria actual pendiente |
| LEG-04 | Datos, finalidades y consentimiento: Ley 29733 / reglamento [S3/S4] | Responsable/encargado según finalidad y categoría | Registro de finalidad/base; aviso y consentimiento cuando corresponda | Privacidad + asesor | Versiones, evidencia y permisos; BK-22 | Referencias consultadas; clasificación por finalidad pendiente |
| LEG-05 | Incidentes: DS 016-2024-JUS arts. 34–36 [S3] | Supuestos de notificación y roles del tratamiento | Registrar conocimiento/evaluación, plazo cuando aplique y constancias diferenciadas | Responsable del tratamiento + privacidad/seguridad | Registro, decisión y borradores; AC-14 | Texto consultado; procedimiento de la notaría por aprobar |
| LEG-06 | Oficial de datos: DS 016-2024-JUS art. 37 [S3] | Designación según condiciones, sin asumir obligación universal | Evaluación de aplicabilidad, nombramiento/contacto si corresponde | Titular + asesor | Evaluación y designación documentadas | Fuente revisada parcialmente; aplicación pendiente |
| LEG-07 | Derechos ARCO y conservación: Ley 29733 / DS 016-2024-JUS [S3/S4] | Solicitante legitimado y límites aplicables | Identidad, evaluación, plazos y respuesta; bloqueo por deber de conservación | Privacidad + notario | Expediente de solicitud y decisión; AC-15 | Artículos/plazos por derecho y conservación pendientes |
| LEG-08 | PLAFT: Res. SBS 01754-2024 y modificatorias [S5] | Notario y OCP, con responsabilidades distintas | Diligencia, reserva, riesgo y revisión humana; no automatizar ROS | Notario + cumplimiento | Sustento de revisión y permisos; AC-13 | Referencia sectorial consultada; régimen específico pendiente |
| LEG-09 | RO: Res. SBS 01139-2025, 03012-2025 y 01917-2026 [S6/S7/S8] | Formato, periodos, canal y reparto de envío vigentes | Exportador versionado, validación y cargo; calendario condicionado | Cumplimiento + asesor | Archivo/revisión/recepción; AC-17 | Cambios 2025 consultados; solo ficha 2026 verificada; anexos pendientes |
| LEG-10 | Firma digital: Ley 27269/reglamento y acreditación [S9] | Firmante, prestador, producto y destino | Control de clave, validación y evidencia de versión | Notario + proveedor habilitado | Archivo firmado y validación; AC-16 | ROPS identificado/consultado; perfil y producto por validar |
| LEG-11 | SID/SUNARP: disposiciones por acto [S10] | Canal y documento admitidos | Modo asistido, cargo y seguimiento con fuente | Notario/presentante autorizado | Cargo y estado; AC-17 | Recurso oficial identificado; manual/directiva vigente por confirmar |
| LEG-12 | Archivo y conservación: DL 1049/AGN | Categoría documental y deber de custodia | Ubicación física, versiones, retención y legal hold | Notario + archivo/asesor | Trazabilidad y recuperación; BK-31 | Normas/artículos/plazos específicos por verificar |
| LEG-13 | No contenciosos: Ley 26662 y normas específicas | Procedimiento efectivamente incorporado | Catálogo por tipo, publicaciones, calendario y oposición | Asesor + notario | Caso y checklist aprobados | Pendiente; módulo fuera del primer alcance comprometido |
| LEG-14 | Confianza digital: DU 007-2020 / DS 126-2025-PCM [S11] | Obligaciones que alcancen a la notaría | Evaluación de alcance y procedimiento de seguridad | Asesor + seguridad | Evaluación fundada y runbook | Ficha consultada; aplicabilidad por definir |
| LEG-15 | Reclamaciones/consumidor | Régimen, servicio y plazos aplicables | Registro, respuesta y evidencia en módulo posterior | Administración + asesor | Caso completo y control de plazo | Norma/artículo y necesidad por verificar |

Los controles y pruebas son propuestas de ingeniería. No se activa una excepción por el mero hecho de que el proveedor no responda; el método admitido y su constancia requieren revisión profesional.

## 2. Fuentes y alcance de consulta

- **S1:** [DL 1232, El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/1292707-2), publicación 26/09/2015. Texto de identidad consultado; no se afirma consolidación exhaustiva del DL 1049.
- **S2:** [Informe 030-2016-SUNAT/5D0000](https://www.sunat.gob.pe/legislacion/oficios/2016/informe-oficios/i030-2016.pdf). El criterio sobre importe RENIEC e IGV se verificó; aplicación actual requiere responsable tributario.
- **S3:** [DS 016-2024-JUS, publicación oficial alojada por Congreso](https://www3.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf), 30/11/2024. Texto consultado para incidentes y disposiciones relacionadas; no se certifica revisión de todas las modificaciones posteriores.
- **S4:** [Ley 29733, Congreso/gob.pe](https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470). Referencia oficial identificada; consolidación y fundamento concreto por finalidad pendientes.
- **S5:** [Res. SBS 01754-2024](https://intranet2.sbs.gob.pe/dv_int_cn/2361/v2.0/Adjuntos/1754-2024.R.pdf). Referencia sectorial consultada en la preparación del prompt; no equivale a revisión de todas las obligaciones.
- **S6:** [Res. SBS 01139-2025, El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/2384197-1). Instructivo identificado, sujeto a posteriores cambios.
- **S7:** [Res. SBS 03012-2025, El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/2432515-1). Modificación consultada; no usar sus fechas aisladas.
- **S8:** [Buscador oficial SBS, ficha 01917-2026](https://www.sbs.gob.pe/app/pp/INT_CN/Paginas/Busqueda/BusquedaPortalUIF.aspx?ctl00_ContentPlaceHolder1_rdgUltimaVersionNormasChangePage=1_20). Verificadas ficha, publicación 22/07/2026 y sumilla de modificación/prórrogas; texto íntegro/anexos pendientes.
- **S9:** [ROPS, Indecopi](https://www.gob.pe/59924-registro-oficial-de-prestadores-de-servicios-de-certificacion-oficial-rops). Función del registro consultada durante preparación; ningún producto/certificado de cliente verificado.
- **S10:** [Manual Sistema Notario, SUNARP](https://www.gob.pe/institucion/sunarp/informes-publicaciones/3502007-manual-del-modulo-sistema-notario). Recurso identificado; no demuestra una API disponible.
- **S11:** [DS 126-2025-PCM, PCM](https://www.gob.pe/institucion/pcm/normas-legales/7370829-126-2025-pcm), 04/11/2025. Ficha y objeto consultados durante preparación; alcance por validar.

## 3. Activación y mantenimiento

Por fila deben completarse, antes de habilitarla: responsable nominal, texto/artículo consolidado, publicación/vigencia, supuesto, control final, evidencia, prueba y aprobación. Guardar fecha y versión de cada decisión. Toda regla cargada al sistema conserva fuente y vigencia.

El calendario de incidentes evalúa el supuesto y el hito de conocimiento; no inicia automáticamente todo plazo al crear el ticket. En el RO, obtener resolución/anexos 2026 antes de fijar fechas o estructura. En ARCO/conservación, no convertir consentimiento o supresión en reglas universales.

No publicar borradores regulatorios ni reportar a entidades desde el ERP sin revisión y autorización. Conservar el cargo/resultado original y no presentar una exportación local como envío aceptado.

## Actualización técnica del 29/10/2026 · Fase 5

- LEG-04: finalidad/base/aviso/política por versión, evidencia textual y consentimiento/retiro. Catálogo vacío; no hay consentimiento universal ni destrucción automática.
- LEG-05: conocimiento, evaluación por destinatario, hito/plazo orientativo, no aplicación fundada y constancia externa separada. ANPD/CNSD no desplazan el conocimiento registrado; no se notifican desde ERP.
- LEG-07: ARCO con política/calendario congelados, identidad, ampliación única y respuesta/evidencia. Procedimiento operativo de subsanación/suspensión pendiente. Ninguna respuesta ejecuta borrado.
- LEG-08: diligencia/PEP declarado/beneficiario/origen/riesgo/revisión humana en bandeja reservada. Solo Notario custodio local; sin ROS o consulta externa.
- LEG-09: contrato interno `notariaos-ro-review-v1`, origen/historial/revisión/periodo/huellas y cargo declarado. **Formato SBS/OCP no habilitado**, anexos consolidados y homologación pendientes.
- LEG-12: conservación por persona/categoría/expediente, bloqueo sin vencimiento automático y levantamiento reservado; no determina plazos legales de protocolo/archivo.

Consulta puntual nueva: DS016-2024-JUS, arts.34–36/69–71 en texto oficial; ficha SBS01917-2026 en buscador UIF. No se afirma consolidación normativa exhaustiva ni validación jurídica de la notaría. Las fuentes oficiales están enlazadas en ADR0009. Evidencia ejecutada en fase5, siempre QA separada.

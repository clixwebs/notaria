# Evidencia BK-14 · NotariaOS 0.4.3

29/10/2026. Corte local de plantillas jurídicas solicitado por André, sobre el núcleo existente. Observado mediante las ejecuciones descritas; no acredita contenido jurídico aprobado ni habilitación operativa.

## Resultado ejecutado

- `npm run build`, `npm run typecheck`, `npm run lint`: correctos. Sin advertencias de lint al cierre.
- `npm test`:37 pruebas unitarias correctas; ocho nuevas de plantilla/gramática/tipos/decimales/contexto/permisos.
- `npm run test:e2e`:55 pruebas correctas,0 fallos/omitidas/reintentos,105996.947 ms. [Reporte completo](fase-4-3-e2e.json). Regresión46 y9 nuevas de BK-14. Primera pasada QA-01:54 correctas; se añadió recuperación de contexto y se repitió en QA-02 nueva.
- Once grupos BK-14: [original](fase-4-3-integridad.json), [restaurada](fase-4-3-integridad-restaurada.json). Inmutabilidad, reconstrucción/huellas, vínculos/versiones, revisión del catálogo, oficina/permisos, rollback por fallo de auditoría, ausencia de efectos financieros/fiscales/tarifarios y reintento tras reinicio.
- Regresión de integridad: [12 grupos fiscales](fase-4-3-fiscal-integridad.json), [7 tarifarios](fase-4-3-tarifas-integridad.json), [12 financieros](fase-4-3-finanzas-integridad.json); también [fiscal restaurada](fase-4-3-fiscal-integridad-restaurada.json), [tarifas restauradas](fase-4-3-tarifas-integridad-restaurada.json), [finanzas restauradas](fase-4-3-finanzas-integridad-restaurada.json).
- Copia/restauración CLI secuencial: [34 tablas con exactamente las mismas filas](fase-4-3-restauracion.json). Comparación por hash de JSON canónico de filas ordenadas, sin imprimir contenido. Auditoría de las verificaciones excluida porque sus lecturas agregan evidencia.
- [Revisión principal anónima](fase-4-3-revision-local.json):acceso200, APIs protegidas401, plantilla→acceso, sin errores de página ni creación de cuentas QA.

La UI prueba publicación con variables, retirada/reactivación, texto plano, vista previa/generación, actualización explícita de base ante conflicto y renovación del contexto sin perder valores. Las APIs prueban TOTP/permisos, valores inválidos/ajenos, doble clic, conflictos, conservación de documentos/revisiones al cambiar plantilla/ficha y solicitud repetida después de retirar la versión. La generación no cambia el estado financiero ni fiscal.

## Entornos y recuperación

Principal identificada en Windows(proceso23300), detenida y respaldada cerrada antes de migrar: `backups/local-2026-10-29 T11-06-36-379 Z`. Se vuelve a servir0.4.3 en3100 con `.notaria/`, sin usuarios/documentos QA. Ningún script de integridad se ejecutó sobre esa base.

QA final `.notaria-phase43-qa-02`; copia `backups/local-2026-10-29 T11-22-19-197 Z`; restaurada `.notaria-phase43-restaurada-qa-02`. Ambas detenidas al verificar. El propietario3101 fue comprobado ausente desde Windows. QA-01 es antecedente detenido, no se reutilizó para la ejecución final.

Muestra sintética final:2 plantillas,7 publicaciones,11 solicitudes,4 borradores generados dentro de7 borradores totales;23 expedientes. Finanzas38 entradas/47 solicitudes, deuda907.21/anticipos5.20/terceros100.00/efectivo100.00. Esos importes provienen de la regresión financiera/fiscal, no de generar documentos jurídicos.

`verify-phase43-integrity.ts` genera/repite adicionalmente en una copia reiniciada en memoria; comprueba una sola versión y que el original en disco no cambió. El verificador42 conserva un único timeout fiscal recuperable en QA y lo resuelve solo en su copia en memoria. Nunca dos procesos sobre un mismo directorio PGlite.

## Interfaz y alcance de accesibilidad

Componentes/tokens ELDIAL/Clix existentes, Montserrat, negro/azul, navegación superior y móvil. Axe sin violaciones y reflujo de página correcto en las vistas cubiertas1440/683/390; diálogo oscuro, Escape y restitución de foco correctos; sin errores de página. Capturas inspeccionadas visualmente. Tabla con desplazamiento horizontal propio; diálogo largo con desplazamiento vertical. No se declara conformidad WCAG completa.

- [Escritorio](fase-4-3-plantillas-1440.png), [tableta](fase-4-3-plantillas-683.png), [móvil](fase-4-3-plantillas-390.png), [diálogo oscuro](fase-4-3-plantillas-oscuro.png).

## Trazabilidad y límites

[ADR0007](../adr/0007-plantillas-juridicas-versionadas.md), [entrega](../phase-4-3/ENTREGA.md), [reutilización](reuse-ledger.md), [resumen ejecutado](validacion-fase-4-3.json), [manifiesto de fuentes](fase-4-3-fuentes.json). Sin repositorio Git en esta carpeta, PR ni publicación. Sin nuevas dependencias y sin consulta de referencias/secretos/bases de clientes de App prueba.

Catálogo inicialmente vacío; no se suministran cláusulas jurídicas aprobadas. Texto plano sin DOCX/PDF, condiciones/repetidores, importación de modelos o firmas. Publicar registra revisión del texto base por Abogado/Notario; no exige doble aprobador ni autoriza documentos. El borrador generado requiere su revisión profesional exacta. BK-15–17, validación jurídica/operativa, PostgreSQL de servicio y preparación del piloto siguen pendientes. BK-26 real deshabilitado; no se añadió proveedor ni emisión a SUNAT. No se repitió la validación XSD de4.2 porque el XML no cambió; su evidencia anterior conserva su alcance limitado.

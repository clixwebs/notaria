# Evidencia ejecutada · Fase 6, alcance local integrado

29/10/2026 · NotariaOS0.7.0 · BK-24–26 juntos, sin subfases. Una sola notaría; ELDIAL/Clix preservado. **No cierra integraciones reales:** [dependencias](../phase-6/DEPENDENCIAS.md), [decisión](../adr/0010-integraciones-locales-y-traslado-asistido.md), [entrega](../phase-6/ENTREGA.md). No se consultaron secretos, bases de clientes o referencias App prueba. Sin paquetes nuevos, proveedores, publicación o envíos externos.

## Resultados finales

| Comprobación ejecutada | Resultado |
| --- | --- |
| `npm test` | 52 correctas,0 fallos/omitidas |
| `npm run build` | Correcto, `/api/integrations` incluida |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm run test:e2e` | **83 correctas**,0 fallos/omitidas/reintentos,184573.515ms |
| Integridad en QA final cerrada | 15 grupos correctos, destructivas solo en memoria |
| Integridad tras restaurar | 15 grupos correctos |
| Comparación original/restaurada | **51 tablas iguales**, incluyendo bytes privados; clave igual sin divulgarla |
| Revisión principal anónima | Login200, APIs/archivos nuevos y anteriores401, páginas→acceso, sin errores de página |

JSON: [resumen](validacion-fase-6.json), [83 escenarios](fase-6-e2e.json), [integridad](fase-6-integridad.json), [integridad restaurada](fase-6-integridad-restaurada.json), [restauración](fase-6-restauracion.json), [principal](fase-6-revision-local.json), [fuentes](fase-6-fuentes.json).

## Cobertura y límites

74 regresiones anteriores y9 escenarios nuevos en una pasada final correcta. Sesión/TOTP/origen y rol revocado; Caja sin acceso a identidad/traslado/descargas, Notario sin fiscal; bloqueo fijo real y rechazo de campos de conexión; evaluación por versión, UUID concurrente y conflicto de cuerpo; spike conserva cuatro resultados y no afirma hardware; manifiesto exacto/no presentado; firma inválida/revocada/indisponible o hash ajeno bloquean cargo; favorable simulado/cargo único/seguimiento; archivo externo/informe/cargo privados con marca no verificado; demo declarada ligada al XML sin cambiar fiscal/finanzas/privacidad; formulario conserva datos al rebasar revisión; teclado/reflujo/axe/oscuro/móvil.

Las pruebas suben tres archivos sintéticos explícitos para el flujo externo. Eso amplía el catálogo de sustentos de la API financiera; la comparación toma el estado después de esas cargas y antes de las operaciones de integración, además de comprobar igualdad antes de cargarlas. No se excluyen saldos o movimientos. El verificador compara todas las tablas previas antes/después de una operación nueva de integración y rollback.

Se inspeccionaron capturas [1440](fase-6-integraciones-1440.png), [390](fase-6-integraciones-390.png), [diálogo oscuro](fase-6-integraciones-oscuro.png) y [traslados móvil](fase-6-traslados.png); también se generó [683](fase-6-integraciones-683.png). Negro/azul, Montserrat, login y barra compacta conservados. Tablas con región desplazable propia; sin desbordamiento de página. Axe sin violaciones en vistas cubiertas, Escape y retorno de foco; no acredita WCAG integral. Regresión con prefijo `fase-6-regresion` conserva las capturas de fase5.

## Bases, procesos y recuperación

QA final **`.notaria-phase6-qa-03`**, restaurada **`.notaria-phase6-restaurada-qa-03`**, ambas detenidas.9 registros de integración,17 eventos/solicitudes,2 manifiestos. No se agregan registros de prueba al disco por el verificador. `qa-phase6-guard.ts` exige inspección real de Windows y rechaza un servidorQA activo antes de abrir PGlite; ruta limitada a bases de fase6 dentro del proyecto. Destructivas en memoria. Original/restaurada se comparan secuencialmente.

Se comprobó el proceso Windows22372 de3101 y se detuvo antes de:

```powershell
npx tsx scripts/verify-phase6-integrity.ts .notaria-phase6-qa-03
npx tsx scripts/backup-local.ts .notaria-phase6-qa-03
npx tsx scripts/restore-local.ts backups/local-2026-10-29T13-48-22-195Z .notaria-phase6-restaurada-qa-03
npx tsx scripts/verify-phase6-integrity.ts .notaria-phase6-restaurada-qa-03
npx tsx scripts/compare-phase6-restoration.ts .notaria-phase6-qa-03 .notaria-phase6-restaurada-qa-03
```

Los15 grupos verifican cadenas/manifiestos, declaraciones sin verificación ficticia, bloqueos reales, cuatro tablas append-only, roles, oficina, rollback de auditoría, reintento único, conflicto de cuerpo, revisión obsoleta, reinicio, ausencia de cambios en módulos previos y detección de alteraciones de evento/artefacto. La comparación de51 tablas incluye archivos/bytes; excluye auditoría por lecturas registradas, como en fase5. No es ensayo de recuperación en infraestructura operativa o PostgreSQL externo.

Principal: identificado Windows13544 en3100 antes de abrir ninguna base; se detuvo y respaldó cerrada a **`backups/local-2026-10-29T13-35-19-713Z`**. Servicio actualizado reabierto en **3100**, sesión herramienta63919, **Windows25260**, `.notaria/`. `check-review-phase6.ts` comprobó protección sin crear usuarios/expedientes/archivos QA. Solo3100 en escucha al cierre; QA01/02/03 y restaurada detenidas. Nunca dos procesos por carpeta PGlite.

## Intentos conservados

- Compilación inicial en sandbox: Turbopack no pudo crear junction local en `.next` (Acceso denegado). Compilación Windows autorizada posterior correcta; no se alteró el código para ocultar el fallo.
- TypeScript inicial señaló inferencia de literales del adaptador de firma; se corrigió el genérico de `Object.freeze`. TypeScript final correcto.
- [Intento sandbox](fase-6-intento-sandbox.json): bootstrap sin conexiónEACCES,0 escenarios ejecutados correctamente/1 fallo/82 no ejecutados. [Intento de red](fase-6-intento-red.json):ETIMEDOUT entre entornos; mismo resultado. No alcanzaron a crear cuentas enQA01. Se detuvo su servidor y se inicióQA02 fuera del sandbox.
- [QA02](fase-6-intento-catalogo-archivos.json):79 correctas/1 fallo/3 no ejecutadas. Aserción financiera comparaba catálogo anterior a las cargas de archivos contra catálogo posterior; corregida la referencia temporal de la prueba. Dominio financiero intacto.
- QA03:83 correctas,0 fallos/omitidas/reintentos, JSON final independiente. No se reutilizó QA02 ni se cambiaron límites de autenticación; se respetan ventanas reales ante429.

`RTK.md` referenciado en la instrucción no estaba disponible en proyecto, padres directos o ubicaciones de instrucciones revisadas. Se leyó AGENTS y los documentos requeridos; no se inventaron reglas RTK ni se modificó esa instrucción.

## Qué no acredita la evidencia

No se conectó RENIEC ni un lector; no se capturó biometría. No se firmó criptográficamente, verificó certificado/revocación/TSA, generó parte oficial o presentó a SUNARP. Un informe o cargo externo es declaración no verificada. No se ejecutó demo real de facturación, validó CDR o emitió a SUNAT. No hay comunicaciones ni habilitación SBS/OCP. La [matriz de dependencias](../phase-6/DEPENDENCIAS.md) conserva responsables propuestos y pruebas reales requeridas. Políticas jurídicas/tributarias, seguridad, operación, infraestructura y piloto siguen pendientes.

Manifiesto final: **142 fuentes SHA-256**. Solo cinco fuentes anteriores cambiaron: package/lock, workspace, platform y compliance.scenarios (prefijo de capturas). Dominios financiero/fiscal/PLAFT/procedimiento anteriores sin cambios. El verificador de enlaces reconoce sufijos de línea en enlaces de archivo; no se cambiaron sus destinos.

Documentación final: **305 enlaces locales válidos**, 0 rotos; detalle en fase-6-documentacion.json.

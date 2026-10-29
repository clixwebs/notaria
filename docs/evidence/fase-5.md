# Evidencia ejecutada · Fase 5

29/10/2026 · NotariaOS0.6.0 · BK-21–23 en una sola entrega, sin subfases. Entorno Windows/Node24, Next16.4.3, React19.3.1, TypeScript5.9.3, PGlite0.5.x; dependencias existentes, sin paquetes nuevos. No se ejecutaron referencias App prueba ni se consultaron secretos/bases de clientes. No hay repositorio Git en esta carpeta; manifiesto SHA-256 identifica fuentes.

## Resultados finales

| Comprobación ejecutada | Resultado |
| --- | --- |
| `npm test` | **47 correctas**,0 fallos/omitidas |
| `npm run build` | Correcto; ruta `/api/compliance` incluida |
| `npm run typecheck` | Correcto |
| `npm run lint` | Correcto |
| `npm run test:e2e` / `playwright.phase5.config.ts` | **74 correctas**,0 fallos/omitidas/reintentos,181027.708ms |
| Integridad QA final cerrada | **13 grupos correctos**, copia destructiva solo en memoria |
| Integridad tras restauración CLI | **13 grupos correctos** |
| Comparación original/restaurada | **46 tablas iguales**, filas/hashes y bytes de documentos privados; clave local igual sin divulgarla |
| Revisión principal sin sesión | Login200, APIs/archivo de cumplimiento y módulos previos401, páginas protegidas→acceso, sin errores de página |

JSON finales: [resumen](validacion-fase-5.json), [suite completa](fase-5-e2e.json), [integridad](fase-5-integridad.json), [integridad restaurada](fase-5-integridad-restaurada.json), [restauración](fase-5-restauracion.json), [revisión principal](fase-5-revision-local.json), [fuentes](fase-5-fuentes.json).

## Cobertura

64 escenarios anteriores y10 nuevos de cumplimiento en **una única pasada final toda correcta**. Autenticación/TOTP, origen, permisos directos, API sin sesión, rol revocado y descarga reservada; catálogo sin semillas, política/aviso por versión y retiro; diligencia por interviniente y dinero exacto; doble clic concurrente/UUID/hash/revisión; riesgo solo por revisión humana; identidad ARCO antes de respuesta, bloqueo de cancelación, respuesta parcial, ampliación única y excepción de información; incidentes por hito y destinatario, no aplicación fundada, incertidumbre/constancia/cierre; contrato exportado/cadena/periodo/duplicados/revisión/artefacto congelado, cargo separado; conservación del formulario tras conflicto.

La suite compara los estados completos financiero/fiscal antes y después del módulo nuevo y comprueba que una señal reservada no aparece en API de expediente ni auditoría general. No se cambia autenticación para acelerar pruebas; las regresiones respetan ventanas reales de60s ante429.

Inspección visual de capturas1440/683/390 y modal oscuro; Montserrat/login/barra superior/negro-azul ELDIAL conservados. Reflujo sin scroll horizontal de página, tablas con región propia, Escape/foco y axe sin violaciones en vistas cubiertas. Se inspeccionaron capturas móviles clara/oscura y PLAFT. Sin errores de página observados; no acredita conformidad WCAG integral.

Capturas: [privacidad1440](fase-5-privacidad-1440.png), [683](fase-5-privacidad-683.png), [390](fase-5-privacidad-390.png), [oscuro](fase-5-privacidad-oscuro.png), [PLAFT reservado](fase-5-plaft.png). Regresión con prefijo `fase-5-regresion` para conservar evidencia histórica.

## Integridad y recuperación

`verify-phase5-integrity.ts` acepta solo `.notaria-phase5-qa-*`/`.notaria-phase5-restaurada-qa-*` del proyecto, con servidor propietario detenido. Lee dump y ejecuta las pruebas destructivas en memoria: cadenas y validación del artefacto; cuatro tablas rechazanUPDATE/DELETE; Administración sin lecturaPLAFT/Caja sin descarga; otra oficina sin acceso; fallo deliberado de auditoría después de escribir registro/evento revierte también revisión/solicitud; reintento confirmado una sola vez, incluso tras reinicio; ningún efecto en tablas anteriores; alteración de artefacto/evento detectada; disco intacto.

QA final **`.notaria-phase5-qa-03`**, detenida tras los74 escenarios. Datos sintéticos:13 registros,26 eventos/solicitudes,2 artefactos,2 revisiones de área. Respaldo CLI cerrado **`backups/local-2026-10-29T13-18-08-779Z`**, restaurado a **`.notaria-phase5-restaurada-qa-03`**, también detenida. `compare-phase5-restoration.ts` abre las bases secuencialmente, compara46 tablas y bytes privados, además de la clave local sin imprimirla. Auditoría de pruebas excluida de igualdad de tablas por poder incorporar nuevas lecturas.

Comandos ejecutados, después de comprobar/detener el proceso real Windows propietario de3101:

```powershell
npx tsx scripts/verify-phase5-integrity.ts .notaria-phase5-qa-03
npx tsx scripts/backup-local.ts .notaria-phase5-qa-03
npx tsx scripts/restore-local.ts backups/local-2026-10-29T13-18-08-779Z .notaria-phase5-restaurada-qa-03
npx tsx scripts/verify-phase5-integrity.ts .notaria-phase5-restaurada-qa-03
npx tsx scripts/compare-phase5-restoration.ts .notaria-phase5-qa-03 .notaria-phase5-restaurada-qa-03
```

## Intentos conservados

- QA-01:71 correctas,1 fallo y2 omitidas. Localizador `getByRole('alert')` encontraba mensaje y anunciador de rutas deNext. Corregido a región principal. [JSON](fase-5-intento-inicial.json).
- QA-02:71 correctas,1 fallo y2 omitidas. Tras usar el control de permisos auditado común, la expectativa seguía buscando «no tiene acceso» en vez de «no tiene permiso». Se corrigió la aserción, conservando la denegación403 y la comprobación de ausencia de contenido. [JSON](fase-5-intento-permisos.json). Sus13 grupos de integridad pasaron antes del pase final.
- QA-03:74 correctas,0 fallos/omitidas/reintentos; JSON final independiente. No se reutilizó ninguna base ni se ocultaron fallos anteriores.
- Compilación inicial detectó bytes de codificación Windows en una fuente nueva; se normalizó aUTF-8 y la compilación final pasó. No se modificaron reglas funcionales para superar las aserciones.

## Principal y conservación

Principal respaldada cerrada antes de migración010: **`backups/local-2026-10-29T12-59-55-273Z`**, tras identificar/detener procesoWindows16688 anterior. Revisión0.6.0 activa en **`http://127.0.0.1:3100/cumplimiento/privacidad`**, base`.notaria/`, sesión herramienta95492, **Windows13544**. `check-review-phase5.ts` comprobó las rutas sin crear cuentas ni documentosQA. QA y principal nunca compartieron carpeta. QA-01/02/03 y restaurada están detenidas; solo3100 queda activo.

Comparación contra manifiesto anterior0.5.0: siete archivos existentes modificados:package/lock(version/scripts),globals.css,workspace.tsx,access.ts,platform.ts yprocedure.scenarios.ts(prefijo de evidencia opcional). Ningún cambio en dominio/cálculo financiero, fiscal, tarifario, plantillas o procedimiento anterior. Las fuentes nuevas y todas las existentes quedan en manifiesto de esta entrega; no contieneBD, claves, copias o datos de clientes.

## Límites y dependencias explícitas

Entrega de ingeniería local de fase5, no habilitación jurídica/operativa. [ADR0009](../adr/0009-cumplimiento-local-reservado.md) conserva decisiones y fuentes oficiales consultadas. Notario como custodio local no acredita designaciónOCP; políticas, plazos/calendarios, avisos, categorías de archivo y supuestos requieren revisión/responsables nominales. El reloj orientativo de incidentes no determina automáticamente todas las obligaciones de comunicación. ARCO no resuelve subsanación/suspensión normativa ni ejecuta supresión; sustento textual/referencia no verifica originales.

**Formato oficial SBS/OCP deshabilitado:** se entrega JSON interno `notariaos-ro-review-v1`, marcado no homologado/no presentado, con validación del contrato propio. No se afirma conformidad con anexos, catálogos, calendario o estructura regulatoria2026; homologación y autorización pendientes. Cargo es declaración externa no verificada, no aceptación. No hayROS, red de proveedor, notificación ANPD/CNSD, integración real o publicación. **Emisión realSUNAT sigue deshabilitada.**

No se ensayaron PostgreSQL externo, infraestructura operativa, gestión privilegiada, revisión externa de seguridad, cifrado/antivirus gestionados, anclaje independiente, carga/RPO/RTO o piloto. Su evidencia no se sustituye con esta prueba local.

Manifiesto final: **127 fuentes SHA-256**. Comprobación de documentación: **261 enlaces locales válidos**,0 rotos.

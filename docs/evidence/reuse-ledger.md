# Registro de reutilización

**Adición BK-14 / 0.4.3:** se reutilizan internamente `case_drafts`, sus revisiones/contexto/SHA-256 y mecanismos de transacción/auditoría, el patrón de catálogo inmutable del tarifario, `ControlledModal`, `PageHeading`, `Badge`, `CaseError`, tablas y tokens ELDIAL/Clix. Nuevo motor de texto plano y permisos profesionales propios. Sin nuevas dependencias, sin acceder a referencias de App prueba en este corte. Regresión de versiones/caja/fiscal y pruebas específicas de plantillas documentadas en [evidencia 4.3](fase-4-3.md).

29/10/2026 · corte 4.2. Este registro documenta la adaptación fiscal de BK-19. No reconstruye retrospectivamente un inventario exhaustivo de todas las piezas visuales de fases previas; sus antecedentes están en [referencias](../phase-0/01-referencias-y-reutilizacion.md) y entregas respectivas.

Raíz de referencia: `C:/Users/ANDRE/Desktop/App prueba/ElDial`, solo lectura. No se ejecutaron sus módulos ni se abrieron secretos, configuraciones de producción o bases de clientes.

| Origen leído | Destino | Adaptación / exclusión | Dependencia y autorización | Validación |
| --- | --- | --- | --- | --- |
| `src/lib/smartpse-xml.ts`, contratos/bloques puros iniciales | `src/lib/fiscal-domain.ts`, `src/server/fiscal-xml.ts` | Contrato Invoice/cliente/conceptos, namespaces y bloques XML. Cálculos reescritos con cadenas/BigInt; sin Float, firma, guías, stock ni configuración retail | Reutilización propia autorizada por André; no se copió cliente ni datos del emisor | Unitarias de decimal/escape y XML leído por DOMParser en E2E |
| `src/lib/sunat-qr.ts`, orden de campos de QR y desglose | `buildFiscalQR` y `fiscalLines` | Campos de identificación e importes exactos; envoltorio SIM explícito y SHA-256 local. Sin fallback automático a DNI, sin afirmar QR fiscal válido | Mismo alcance de reutilización; nuevo contrato de prueba | Codificación `qrcode` y lectura independiente `jsqr`, tanto unitaria como PNG servido por API |
| `src/lib/smartpse.ts`, declaraciones estáticas/localización de resultados y simulación | `src/server/fiscal-adapter.ts` | Separación entrada/resultado; nuevo simulador puro con clave/huella, incertidumbre, consulta y recibo durable. No se copió ni ejecutó red/configuración del archivo | No se consultaron valores de configuración o secretos; proveedor real excluido | Casos de aceptación/rechazo/proceso/timeout/fallo; rechazo de respuesta ajena y recuperación tras reinicio |
| `qrcode` 1.5.4 / `@types/qrcode` 1.5.6 | Generación PNG local / tipos | Importación de paquete, sin servicio remoto | MIT, licencias conservadas en `node_modules`/paquetes y lock | PNG protegido con hash y decodificación independiente |
| `jsqr` 1.4.0 | Pruebas de QR | Dependencia de desarrollo; no se entrega como cliente fiscal | MIT, licencia conservada en paquete/lock | Decodifica los píxeles del PNG real del documento QA |

No se afirma compatibilidad SUNAT por esta adaptación. Los módulos originales no se modificaron ni sus pruebas se ejecutaron como si validaran NotariaOS. La habilitación fiscal requiere contrato y validación propios.

## Fase5 · 29/10/2026

Reutilización interna deNotariaOS: ControlledModal,formularios/tablas/estados,tokens ELDIAL,case-tabs,api/TOTP/permisos/auditoría/transacciones y scripts de copia/restauración. Dominio nuevo de cumplimiento, sin dependencias nuevas ni acceso aApp prueba. No se ejecutaron proyectos o bases de referencia. Adaptación del prefijo de capturas de procedimiento conserva evidencias históricas.

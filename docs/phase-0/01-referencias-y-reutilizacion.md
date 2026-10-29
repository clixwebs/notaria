# Referencias y estrategia de reutilización

Revisión estática y visual: 29/10/2026. ElDial es un ERP de retail. Su código se consultó como referencia; no se ejecutó. André autorizó aprovechar todo lo posible y confirmó una sola notaría.

## 1. Evidencia técnica

Las líneas corresponden a la copia local inspeccionada. No se consultaron bases, secretos ni estado de producción.

| ID | Fuente y ubicación | Observado | Decisión |
| --- | --- | --- | --- |
| REF-01 | [AGENTS](<C:/Users/ANDRE/Desktop/App prueba/ElDial/AGENTS.md>) y [MEMORY](<C:/Users/ANDRE/Desktop/App prueba/ElDial/MEMORY.md>) | Continuidad documental y límites de publicación; memoria distingue hechos/antecedentes | Adoptar el método; no ejecutar pendientes de otro proyecto |
| REF-02 | [package.json](<C:/Users/ANDRE/Desktop/App prueba/ElDial/package.json:22>) y `package-lock.json` | Next 16.2.9, React 19.2.4, Prisma 7.8.0, NextAuth beta.31, Tailwind 4.3.1, motion 14.5.0 en lock | Compatibilidad de referencia; seleccionar versiones soportadas antes de instalar |
| REF-03 | [Tema](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/app/globals.css:24>) | Colores en `@theme`, tipografías y estados semánticos | Alta reutilización, nueva marca y verificación de contraste |
| REF-04 | [Configuración de sedes](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/tenant.ts:56>) y [proxy](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/proxy.ts:72>) | Configuración, alias, query/cookie, cabeceras y features | Sustituir por configuración de una notaría; conservar solo temas/features útiles |
| REF-05 | [Prisma](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/prisma.ts:11>) | Selección de conexiones por sede y contexto | Una conexión operativa, sin fallback a sede predeterminada |
| REF-06 | [Auth](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/auth.ts:101>) | Credentials, JWT, permisos y cambio de sede | Reutilizar experiencia de acceso; evaluar MFA/revocación y proveedor antes del núcleo |
| REF-07 | [Permisos](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/access.ts:32>) y esquema `RolePermission` | Permisos por rutas; defaults y excepciones definidos para retail | Nuevo control recurso/acción/alcance con denegación predeterminada |
| REF-08 | [Wrapper API](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/api-helpers.ts:23>) | Sesión, concordancia de sede y ejecución en contexto | Reutilizar patrón de frontera autenticada; separar autorización, auditoría y utilidades de negocio |
| REF-09 | [Auditoría](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/api-helpers.ts:77>) y [clasificador](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/datos-personales.ts:1>) | `logAudit` tolera errores; listas excluidas por diseño del clasificador | Auditoría durable para acciones críticas y política explícita de lecturas reservadas |
| REF-10 | [Diferencias de campos](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/audit.ts:1>) | Funciones puras y normalización | Candidatas a extracción con lista permitida de campos y redacción de datos |
| REF-11 | [Esquema](<C:/Users/ANDRE/Desktop/App prueba/ElDial/prisma/schema.prisma:819>) | Pagos y asignaciones; importes `Float`; esquema con dominio retail amplio | Reaprovechar ideas de movimientos, no copiar el esquema completo |
| REF-12 | [Comprobantes](<C:/Users/ANDRE/Desktop/App prueba/ElDial/prisma/schema.prisma:1174>) | `Invoice`, `InvoiceFile`, `InvoiceSeries`, XML/CDR separados del listado | Adaptar modelo decimal, estados externos y secuencias por emisor/tipo/serie |
| REF-13 | [SmartPSE](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/smartpse.ts:194>), `smartpse-xml.ts` y README | Construcción/envío y respuestas; README declara prueba simulada y demo pendiente | Adaptador candidato; prueba de contrato y luego demo autorizada de la notaría |
| REF-14 | [Reportes](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/report-catalog.ts:40>) | Catálogo central con grupos, URLs y filtros | Reutilizar contrato de catálogo, nuevas métricas/consultas y permisos |
| REF-15 | [Fechas](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/dates.ts:1>) y [sesión](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/lib/sesion.ts:1>) | Cálculos Lima y corte diario | Extraer utilidades probadas; separar fecha civil, instante y calendario legal |
| REF-16 | [Paginación](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/components/ui/pagination.tsx:1>), `empty-state.tsx`, `dialog-provider.tsx` | Componentes compactos; diálogos centralizados | Adaptar semántica/foco/tamaño táctil; no adoptar interceptación global de `window.alert` |
| REF-17 | [Cabeceras](<C:/Users/ANDRE/Desktop/App prueba/ElDial/next.config.ts:31>) y [layout](<C:/Users/ANDRE/Desktop/App prueba/ElDial/src/app/layout.tsx:63>) | CSP Report-Only, políticas y viewport con zoom restringido | CSP efectiva y permitir zoom; probar impresión y dispositivo real |
| REF-18 | `src/lib/sesion.test.ts`, `datos-personales.test.ts`, `smartpse.test.ts` | Pruebas de reglas puras y respuestas simuladas; 150 archivos de prueba bajo `src` localizados | Mantener disciplina y crear pruebas del dominio notarial; no se ejecutó suite |
| REF-19 | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` | Convención `proxy` y límites de ejecución | Consultar documentación de versión antes de implementar; proxy no es la única autorización |

El conteo de 150 archivos no implica 150 suites activas en CI ni cobertura suficiente; no se inspeccionó el comando completo de cada prueba ni su estado de ejecución.

## 2. Revisión visual realizada

| ID | Archivo inspeccionado | Hallazgo útil | Tratamiento |
| --- | --- | --- | --- |
| VIS-01 | `ElDial-muestras-pantallas/9-login-nuevo.png` | Separación de marca/acceso y jerarquía de credenciales | Formulario sobrio con MFA; no copiar marcas/contactos ni efecto de video |
| VIS-02 | `ElDial-muestras-pantallas/10-login-movil.png` | Formulario apilado con controles grandes | Adaptar tamaño y recuperación; revisar foco y zoom |
| VIS-03 | `ElDial-muestras-pantallas/1-pos-vacio.png` | Espacio central operativo y panel de acción | Expediente con revisión central y siguiente acción contextual |
| VIS-04 | `capturas-compacto/port-eldial-oc-lista.png` | Filtros, ayuda contextual, tabla y acciones | Bandeja de expedientes y requisitos con densidad equivalente |
| VIS-05 | `capturas-compacto/port-demo-oc-lista.png` | Variante neutra del mismo patrón | Base para tokens sin identidad retail |
| VIS-06 | `capturas-compacto/port-market-oc-lista.png` | Marca verde mediante tema | Confirma variación visual; no supone otra arquitectura |
| VIS-07 | `ElDial-muestras-comprobantes/7-factura-con-qr-sunat.png` | Emisor, detalle, totales y QR | Referencia de legibilidad; nuevos conceptos/notaría y datos ficticios |

Raíz de las rutas visuales: `C:\Users\ANDRE\Desktop\App prueba`. Las imágenes fueron vistas, no copiadas ni incorporadas a datos de prueba. Su apariencia no demuestra aceptación fiscal o funcionalidad vigente.

En `app-demo`, `MarketDonaNelly`, `app-inventario` y `clix-demo` se inspeccionaron tokens de `src/app/globals.css` y dependencias/importaciones de navegación en `src/components/layout/sidebar.tsx`. Comparten la estructura de tema consultada. No se ejecutaron ni se revisó exhaustivamente su comportamiento.

## 3. Plan de reutilización por pieza

| Clasificación | Piezas | Adaptación y prueba antes de aceptar |
| --- | --- | --- |
| Extraer/adaptar con alta reutilización | Tokens, botones, paginación, filtros, diálogos, patrones de estados, fechas, catálogo de reportes | Desacoplar imports, lenguaje notarial, teclado, contraste y casos límite |
| Reutilizar algoritmos/contratos | XML/QR, códigos de respuesta, manejo de archivos fiscales, diferencias de auditoría, reglas de cierres y aplicaciones | Decimal exacto, nueva fuente de configuración, idempotencia, retención y pruebas de contrato |
| Reutilizar concepto con rediseño | Auth, permisos, persistencia, auditoría y seguridad | MFA/revocación, permisos por recurso, auditoría durable y CSP efectiva |
| Construir dominio nuevo | Actos/intervinientes, representación, requisitos, identidad, documentos, instrumentos, folios, traslados, PLAFT/ARCO | Casos de uso y evidencia propios; ninguna equivalencia automática pedido→escritura |
| Excluir | Stock/lotes, restaurante, tienda, fidelización, comisiones y migraciones retail | No añadir por dependencia incidental |

No se fija un porcentaje de código reutilizado sin extracción y pruebas. Maximizar reutilización significa conservar piezas válidas y conocimiento operativo, sin arrastrar dependencias que aumenten riesgo o trabajo posterior.

En la fase de implementación, mantener `docs/evidence/reuse-ledger.md`: origen/rango, destino, adaptación, dependencia/licencia, prueba y decisión. El usuario autorizó reutilización; las licencias de terceros se conservan y se revisan al incorporar activos o paquetes.

## 4. Material disponible sin revisar en detalle

- `Matriz_Permisos_Usuarios.xlsx`: localizado; no abierto ni extraído en esta fase. La nueva matriz se diseña por acciones/recursos, y podrá exportarse a Excel cuando se implemente.
- Plantillas en blanco de seguridad y encargo: localizadas por nombre; contenido no revisado. No se abrieron contratos completados de otras organizaciones.
- PDFs de comprobantes: existen; se usó un PNG equivalente para revisión visual, sin análisis jurídico del PDF.
- Backups, `.env`, datos de clientes y conexiones: excluidos expresamente.

La ausencia de revisión de estos contenidos queda registrada; no se afirma que sean plantillas jurídicas listas para la notaría.

## 5. Guías de diseño consultadas

Leídas `App prueba/skills/frontend design.md`, `skills/diseñador.md`, skill instalada `frontend-design` y `ui-ux-pro-max`. El prompt y el alcance confirmado prevalecen sobre estilos genéricos.

Se ejecutó búsqueda local de sistema visual con `legal case management dashboard`, seguida de una reformulación `internal operations dashboard`. Los resultados incluyeron estructuras de landing comercial, inadecuadas para este ERP. No se adopta ese patrón ni se presenta como coincidencia validada. La dirección visual propuesta se basa en el brief, las capturas revisadas y criterios generales de accesibilidad; queda pendiente de validación visual en fase 1.

## Reutilización · fase 3 integrada

BK-15–17 reutiliza el núcleo local de archivos privados/versiones liberadas, auditoría, roles/TOTP, transacciones, instantáneas, componentes ELDIAL y diálogos. Nuevo dominio de procedimiento y adaptador de identidad fijo simulado; sin dependencias nuevas. No se consultó App prueba, secretos ni datos de clientes en esta entrega. Fuentes técnicas y límites en ADR0008.

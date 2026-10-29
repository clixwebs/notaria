# Prototipo y guía de revisión

29/10/2026. NotariaOS 0.1. Una notaría. BK-01 a BK-06 implementados como demostración sintética, sujetos a revisión de André. El núcleo seguro y persistente corresponde a la fase 2.

## Abrir

- [Acceso](http://127.0.0.1:3100/acceso): misma composición de ElDial con contenido notarial. Credenciales de ejemplo prellenadas; «Ingresar» demuestra el segundo factor y permite continuar.
- [Jornada](http://127.0.0.1:3100/inicio): resumen, bandeja, búsqueda, agenda de ejemplo y siguiente paso.
- [Expediente de compraventa](http://127.0.0.1:3100/expedientes/2026-0048): escenario con requisito e identificaciones pendientes y anticipo.

Servidor local en el puerto 3100; `npm run dev` para desarrollo o `npm run build` seguido de `npm start`. Node verificado: 24.20.0. No se publicó externamente.

## Recorrido de prueba

1. Abrir el expediente 2026-0048 y revisar el resumen.
2. En Requisitos, marcar la representación de ejemplo como revisada.
3. En Documento, marcar la versión como revisada; crear una nueva versión y comprobar que exige revisión otra vez.
4. En Identificación, elegir «No coincidencia» o «Error técnico» y aplicar a un interviniente. La actuación permanece bloqueada.
5. Aplicar «Coincidencia simulada» a todos los intervinientes, revisar el documento y simular la actuación.
6. En Cobros, probar un importe mayor al saldo. Debe mostrar un error; después registrar los S/ 750.00 pendientes del escenario.
7. En Entrega, elegir un destinatario de prueba y registrar la entrega. El expediente queda en consulta.
8. Crear una certificación y comprobar que no exige minuta; abrir una carta y registrar intentos con resultados distintos.

La entrega de la constancia de una carta al solicitante se distingue del resultado de la diligencia al destinatario. Un intento sin respuesta conserva ese resultado y no se transforma en entrega al destinatario.

## Código de ElDial leído y aplicado

Raíz de origen: `C:\Users\ANDRE\Desktop\App prueba\ElDial`. Solo lectura. La instrucción explícita de André sobre interfaz prevalece sobre la propuesta visual inicial.

| Origen | Aplicación en NotariaOS | Tipo de reutilización |
| --- | --- | --- |
| `src/lib/tenant.ts`, `ELDIAL_THEME` | `src/app/eldial.css`: rojo #CF1A29, hover #A8121E, lienzo #FBF4F4, borde #EBD3D5, texto #2A1517 y secundario #7A5A5D | Tokens trasladados; borde de control más contrastado donde exige legibilidad |
| `src/app/layout.tsx` y `fonts/` | Montserrat en interfaz, Plus Jakarta disponible, Roboto para futuras referencias numéricas | Archivos locales copiados con sus licencias OFL |
| `src/app/login/page.tsx` | `src/components/access.tsx`: proporción 1.15:1, panel de video, sello Perú, tarjeta translúcida y formulario | Estructura y acabados adaptados a contenido notarial |
| `src/app/login/login-form.tsx` | Campos de sede/usuario/contraseña, botón de visibilidad y «Ingresar» | Interfaz adaptada; no se reutiliza autenticación retail |
| `src/components/login/login-video.tsx` | Video solo en escritorio; imagen de respaldo y control de pausa; movimiento reducido respetado | Patrón adaptado y recursos Clix copiados |
| `src/app/globals.css`, bloque login | Auroras, ruido SVG y keyframes en `eldial.css` | CSS reutilizado directamente |
| `src/components/layout/sidebar.tsx` | Barra blanca de 56 px, grupos/menú Más, iconos Phosphor, estado activo y controles/perfil | Patrón de navegación leído y adaptado; módulos notariales |
| `src/components/ui/pagination.tsx` | `src/components/ui.tsx`, selección de páginas con extremos y elipsis | Algoritmo adaptado; botones con estados y `aria-current` |
| `src/lib/dates.ts` | `src/lib/domain.ts`, calendario explícito America/Lima | Función de fecha adaptada y probada en cambio de día |
| Componentes/estados y capturas de referencia | Tablas, filtros compactos, botones, paneles, bordes y estados semánticos | Adaptación al mismo lenguaje de interfaz |

Recursos Clix: `public/login-loop.jpg`, `public/login-loop.mp4`, `public/clix-icon.png`. Se usan como presentación de la familia del producto según el pedido de André. No se incorporaron credenciales, RUC, contactos de clientes ni datos operativos de ElDial. El video de presentación es el recurso original de la familia ERP; no afirma mostrar el módulo notarial terminado.

No se reutilizó literalmente la autorización por rutas, separación comercial de sedes, esquema monetario Float o tolerancia a fallos de auditoría. Sus sustitutos operativos deben implementarse en el núcleo de fase 2. Los controles del prototipo no son controles de seguridad del servidor.

## Pantallas y capacidades

Acceso/segundo factor de muestra, jornada, bandeja con filtro/páginas/tablero, nuevo expediente, intervinientes, requisitos, documento y versión, identificación, actuación, cobros, diligencias, entrega y actividad. Directorios de personas/documentos y cuenta por expediente. Configuración con tema oscuro y restauración del escenario. Agenda es un boceto; cumplimiento y portal muestran su estado previsto.

Datos de la sesión viven en memoria, sin almacenamiento local persistente ni base. El documento es una muestra maquetada, no un editor jurídico. Las versiones demuestran el bloqueo y no almacenan archivos firmados. No hay captura biométrica, emisión fiscal, firma real, presentación SUNARP, permisos operativos ni certificación legal.

## Comparación incorporada

[Comparativa](comparativa-mercado.md) y [BK-33 a BK-42](backlog-ampliado.md) amplían presupuesto, gastos, terceros, cuenta consolidada e indicadores. Son planificación adicional. No se anuncian como funcionalidades ya construidas.

## Comprobación técnica

La evidencia ejecutada se conserva en [fase 1](../evidence/fase-1.md) y [resultado de navegador](../evidence/fase-1-e2e.json). Las capturas muestran el estado final de escritorio, móvil y acceso. La revisión automática no acredita conformidad total WCAG ni seguridad de producción.

Dependencias exactas en `package-lock.json`. Next 16.4.3, React 19.3.1, TypeScript 5.9.3. ESLint 9.39.5 conserva compatibilidad con los peers del conjunto actual de plugins Next; npm lo marca deprecado. El intento con ESLint 10 dejó peers incompatibles y se descartó. Revisar la actualización conjunta de esos plugins antes del núcleo operativo; no se forzaron peers incompatibles en la entrega.

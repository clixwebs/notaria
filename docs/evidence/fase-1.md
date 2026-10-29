# Evidencia de fase 1

29/10/2026, America/Lima. Entrega local de prototipo; datos sintéticos.

## Resultado verificado

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| `npm run build` | Correcto, Next 16.4.3 | Compilación optimizada y verificación TypeScript del estado final |
| `npm run typecheck` | Correcto | TypeScript estricto |
| `npm run lint` | Correcto, sin incidencias | Código de aplicación y pruebas |
| `npm test` | 8/8 correctas | Dinero, identidad no concluyente, revisión/versiones, pagos repetidos, bloqueos y calendario Lima |
| `npm run test:e2e` | 14/14 correctas, 16.1 s | [Reporte JSON](fase-1-e2e.json) |
| Pruebas de navegador | Correctas | Compraventa completa, certificación, diligencias, creación, filtros, páginas, tablero, diálogo y acceso demo |
| Disposición y axe | Sin incidencias detectadas en casos probados | Inicio a 1366×768, 1280×1024, 1024×768, 390×844, 375×812, 844×390 y 683×768; tema oscuro y formulario móvil; login escritorio/móvil |
| Rutas principales | 14 rutas con respuesta 200 y título; sin errores JS capturados | No representa una prueba de seguridad de endpoints |
| Instalación | npm informó cero vulnerabilidades conocidas | Resultado del momento de instalación, sin garantía futura ni auditoría de seguridad |

Chrome local, Playwright 1.64.1 y axe 4.14.0. Las pruebas de 683 px verifican reflujo a un ancho reducido; no se presentan como prueba de zoom nativo del navegador al 200%. No se declara conformidad completa WCAG, cumplimiento legal, durabilidad de auditoría, transacciones de BD ni integración real.

## Correcciones durante la revisión

- La primera dirección azul/dorado se descartó por indicación de André. El estado final usa la interfaz y tema de ElDial y conserva sus recursos de Clix.
- Se aumentaron textos pequeños, se corrigieron nombre accesible de búsqueda y contraste del pie.
- Se ocultó del foco el menú móvil cerrado y se acotó su recorrido de teclado al abrirlo.
- Se evitó duplicar la alerta del formulario de cobro.
- Se corrigieron selectores de pruebas para el resultado de diligencia y la navegación agrupada.
- Se ajustó a dos columnas el resumen a ancho de tablet para evitar desbordamiento en 683 px.
- Un build intermedio tuvo EPERM al reutilizar artefactos de procesos con permisos distintos. Se detuvo el servidor y se compiló en el mismo contexto; build final correcto.

## Capturas inspeccionadas

- [Escritorio](fase-1-escritorio.png).
- [Móvil](fase-1-movil.png).
- [Acceso escritorio](fase-1-login-1440.png).
- [Acceso móvil](fase-1-login-390.png).
- [Formulario oscuro](fase-1-nuevo-oscuro.png).

Las capturas finales se generan desde los tests. El acceso se captura con movimiento reducido para una imagen estable; en escritorio con movimiento permitido se reproduce el mismo video de presentación de ElDial, con botón de pausa.

## Referencias y permisos de ejecución

ElDial se mantuvo en solo lectura. No se ejecutaron sus scripts, bases ni servidores. Se copiaron exclusivamente fuentes/licencias y recursos Clix de presentación autorizados por André. Tokens, CSS de auroras y algoritmos adaptados se documentan en [la entrega](../phase-1/ENTREGA.md).

El servidor de NotariaOS se inició localmente en 127.0.0.1:3100 para pruebas y revisión, sin despliegue. Las instalaciones y la conexión del navegador local requirieron el contexto de ejecución autorizado por la herramienta; no se sustituyó por una conexión externa. No se enviaron mensajes ni formularios a Adiasoft/Eureka.

ESLint 9.39.5 presenta un aviso de deprecación de npm; conserva peers compatibles con el conjunto actual de plugins Next. ESLint 10 se probó y descartó al detectar peers incompatibles. Esto debe revisarse como actualización conjunta de herramientas, sin declarar compatibilidad por el mero éxito de una instalación.

La comprobación de documentos/referencias se guarda en [validación final](validacion-fase-1.json). La comparación de hashes identifica la coincidencia de los 48 archivos seleccionados en la instantánea previa; no representa una auditoría histórica de toda la carpeta.

# Dirección del prototipo

29/10/2026. BK-01 a BK-06. Autorización: «Continúa» tras la entrega de fase 0.

Espacio de trabajo para una notaría. Expedientes y la siguiente actuación dominan la pantalla. Se conserva la compacidad, tipografía local y patrones de estados de ElDial; se reemplazan sus menús comerciales por bandeja, revisión documental y requisitos.

**Dirección corregida por André:** la propuesta azul/dorado y lateral de escritorio fue descartada. Se usa el código de ElDial como base de la familia visual: Montserrat local, tema ELDIAL_THEME rojo #CF1A29, hover #A8121E, lienzo #FBF4F4, superficie #FFFFFF, borde #EBD3D5, texto #2A1517 y secundario #7A5A5D. Iconos Phosphor, controles compactos, navegación superior blanca de 56 px, menús agrupados, avatar redondeado, botones y filtros con el mismo tratamiento. Los bordes de controles se refuerzan donde hace falta para contraste. La barra lateral se reserva a móvil. No introducir una nueva identidad visual por considerar más apropiado otro estilo para notarías.

```text
Logo | Dashboard | Expedientes | Personas | Caja | Más | Perfil
Jornada y siguiente acción                            Nuevo
Resumen compacto de estados
Bandeja de expedientes                         Agenda de hoy
Filtros, filas y paginación                     Pendientes
```

Revisión contra el brief: se descarta una portada comercial con grandes cifras y tarjetas repetidas. El inicio debe permitir abrir un expediente en un clic y encontrar bloqueos. La marca es provisional. Los nombres de prueba se rotulan «Demo» y no proceden de las referencias.

Acceso: composición 1.15:1 del código de ElDial, auroras/grano reutilizados, tarjeta de video Clix de escritorio, tarjeta blanca translúcida de 430 px con radio de 28 px, campos de 48 px con radio de 16 px, mismo encabezado y botón «Ingresar». Se adapta el nombre del producto y la descripción a la notaría. Las credenciales son ejemplos de solo lectura; el segundo factor sigue siendo simulado. El video se pausa y se omite con movimiento reducido/en móvil. Adiasoft y Eureka orientan capacidades, no reemplazan esta dirección de interfaz.

La búsqueda de sistema visual se hizo en fase 0; sus coincidencias de landing no encajaron y no se adoptaron. En fase 1 se consulta «keyboard focus modal» (UX) para diálogo/foco. Se usa `<dialog>` nativo, etiquetas visibles y retorno de foco. No se declara conformidad completa WCAG a partir de pruebas automáticas.

Stack confirmado para este corte: Next.js App Router + React + TypeScript; misma familia técnica que ElDial. npm confirma Next 16.4.3 y Node mínimo 20.9; entorno Node 24.20. React 19.3.1 y Phosphor 2.1.10 consultados en registro. TypeScript 5.9 se fija para limitar cambios de compilador mientras se valida Next. Lock registra versiones exactas. Documentación consultada: https://nextjs.org/docs/app/getting-started/installation y https://nextjs.org/docs/app/api-reference/functions/use-search-params .

Persistencia de demostración: memoria de la pestaña; al recargar se restaura el escenario inicial. No hay autenticación ni APIs operativas. El acceso/MFA se demuestra sin solicitar claves reales. Caja usa céntimos enteros, con operaciones demo y sin comprobantes fiscales válidos. Integraciones y decisiones notariales son simuladas explícitamente.

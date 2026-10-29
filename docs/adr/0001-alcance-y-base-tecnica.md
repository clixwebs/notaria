# ADR-0001 — Alcance de una notaría y reutilización de ElDial

Fecha: 29/10/2026. Estado: **alcance confirmado; solución técnica propuesta**.

## Contexto

El prompt v2.0 planteaba varias notarías independientes. André confirmó una sola notaría y pidió aprovechar de ElDial todo lo posible. ElDial es retail; sus referencias se inspeccionaron en solo lectura.

## Decisiones

1. Una notaría, una base operativa y oficinas/cajas internas si están habilitadas. No construir plano SaaS, planes, subdominios por cliente ni aprovisionamiento multi-notaría.
2. Proyecto independiente dentro del workspace. Reutilización autorizada por pieza, conservando origen/licencias y excluyendo secretos, marcas y datos.
3. Monolito modular como propuesta; stack de ElDial candidato, sin instalar ni copiar íntegramente el repositorio en fase 0.
4. Dinero decimal, versiones documentales, permisos por acción/recurso y auditoría durable. La compatibilidad visual no permite omitir estas adaptaciones.
5. No modificar ElDial para facilitar la extracción; cualquier corrección se realiza en el proyecto nuevo cuando se autorice construir.
6. Integraciones con simulación visible o modo asistido hasta pruebas y habilitación. No vender respuestas simuladas como evidencia externa.

## Alternativas

- Clonar todo ElDial y renombrar tablas: descartado por acoplamiento retail, datos/configuración y diferencias de reglas.
- Construir todo desde cero: descartado como punto de partida, porque desperdicia utilidades/componentes útiles y contradice la preferencia del usuario.
- SaaS multi-notaría desde el inicio: fuera del alcance confirmado; mantener modularidad sin construir esa infraestructura.

## Consecuencias

Más reutilización en interfaz/utilidades que en reglas notariales. El motor de expediente, representación, otorgamientos y protocolos necesita diseño propio. No se garantiza un porcentaje de código reutilizado antes de extraerlo y probarlo.

## Pendientes y revisión

Elegir versiones soportadas y mecanismo de autenticación/MFA; confirmar actos, oficinas, carga, lector, proveedores y alojamiento. Si André cambia el alcance a varias notarías, crear un ADR que revise aislamiento y operación, en vez de activar una bandera sin rediseño.

Referencias: [inventario](../phase-0/01-referencias-y-reutilizacion.md), [arquitectura](../phase-0/03-arquitectura-modelo.md), [plan](../phase-0/PLAN-MAESTRO.md).

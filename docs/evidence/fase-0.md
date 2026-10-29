# Evidencia y límites — Fase 0

Fecha: 29/10/2026. Workspace de trabajo: `C:\Users\ANDRE\Desktop\ERP Notaria`.

## Autorización y cambios de alcance

- Pedido: usar el prompt mejorado para revisar referencias y preparar el plan.
- Confirmación posterior: una sola notaría y reutilización máxima compatible de ElDial.
- Aclaración entregada: «una sola operación» significaba una notaría, no un único trámite. El plan usa el término una notaría.
- Preguntas presentadas: alcance de producto, actos/usuarios e integraciones. Alcance respondido; actos/usuarios e integraciones aún desconocidos. No se asume consentimiento de proveedores por falta de respuesta.

## Operaciones realizadas

1. Lectura del prompt, instrucciones de referencias, README y memoria de ElDial.
2. Lectura estática de archivos de configuración/código/esquema y ejemplos de prueba; búsquedas acotadas con `rg`.
3. Lectura de dependencias declaradas y versiones fijadas en lock.
4. Conteo de archivos de prueba bajo `src`: 150 coincidencias de `*.test.ts`/`*.test.tsx`.
5. Inspección de siete PNG de referencia. No se generaron capturas de una aplicación nueva.
6. Revisión de tokens/navegación de cuatro proyectos secundarios; no auditoría exhaustiva.
7. Consulta de fuentes oficiales de identidad, datos, tributación, SBS y documentación de Next.js; alcance detallado en matriz normativa.
8. Lectura de guías de diseño y ejecución del buscador local de la skill, sin instalar paquetes ni adoptar su patrón comercial fuera de contexto.
9. Creación exclusiva del paquete documental de NotariaOS.

No se ejecutaron scripts/tests/build/servidores de los proyectos de referencia; no se consultaron sus bases ni se abrieron `.env`, respaldos o datos de clientes. Ninguna prueba de aplicación de NotariaOS ha sido ejecutada: aún no existe aplicación.

## Correcciones durante la inspección

- Se buscó inicialmente `src/lib/api-auth.ts`; ese nombre no existe. Se localizó el wrapper real en `src/lib/api-helpers.ts` y se corrigió la referencia.
- PowerShell requirió `ConvertFrom-Json -AsHashtable` para leer el lock, que contiene una propiedad vacía en `packages`. La lectura posterior obtuvo versiones completas; no se modificó el lock.
- `RTK.md` no está en la raíz actual ni de ElDial. La memoria de referencia señaló `C:\Users\ANDRE\.claude\RTK.md`; se leyó. Describe RTK y hooks de Claude, sin demostrar automatización equivalente en esta sesión.
- La consulta directa a una página de Prisma falló; no se usa ese fallo como evidencia técnica ni se cita como documentación revisada. Los tipos decimales permanecen propuesta de implementación, por validar con versión y pruebas.

## Evidencia preservada y protección de datos

El inventario enlaza rutas/líneas y hallazgos; no incorpora logos, series, teléfonos, razones sociales ni documentos de clientes de las capturas. No se copiaron las imágenes ni las plantillas completadas.

`referencias-sha256.json` registra los hashes de archivos técnicos/visuales seleccionados al cierre de la revisión. Sirve para identificar las referencias del plan; **no prueba** que una ejecución previa desconocida no las hubiera modificado. No contiene contenido de documentos ni secretos. Una repetición posterior permite detectar cambios respecto a esta instantánea.

## Validación documental de cierre

Comprobación local superada: **11 archivos Markdown**, **37 enlaces locales**, tablas y bloques de código consistentes; **32 historias**, **22 criterios de aceptación** y **15 controles normativos** con identificadores válidos. **48 hashes de referencia coinciden** con la instantánea tomada al cierre de la inspección; cero incidencias detectadas.

Resultado estructurado en `validacion-documental.json`. La revisión documental no sustituye aprobación de alcance, validación jurídica ni pruebas futuras del software.

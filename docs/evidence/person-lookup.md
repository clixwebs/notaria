# Consulta de nombres por DNI · evidencia

29/10/2026. Autorización de conexión solicitada por el usuario; autorización adicional explícita para leer/reutilizar soloAPIPERU_TOKEN deElDial. No se consultaron bases/clientes, no se copiaron otras variables y no se modificó la referencia. [ADR0013](../adr/0013-autocompletado-dni-apiperu.md).

## Ejecutado

Autocompletado en Nueva persona, consulta privadaPOST y adaptador de servidor. Nuevo formulario conserva estiloELDIAL, captura manual, edición existente y guardado por API. Consulta tras700ms al completarDNI, errores/reintento, cancelación y protección frente a respuesta desactualizada/escritura manual. Solo se completa nombre; no se crea ficha hastaGuardar.

Build optimizado,TypeScript ylint correctos. **57unitarias correctas**, incluidas5nuevas que cubren contrato de red/token solo servidor,minimización de salida,entrada/token ausente,errores/cuota,documento distinto,caracteres de control,tamaño máximo,timeout/JSON inválido. No se ampliaron permisos jurídicos.

Dos pasadas enfocadas de7escenarios correctos en bases nuevas`.notaria-lookup-qa-01` y`-02`; la segunda añade captura/ajuste móvil390px sin desbordamiento. [Reporte final](person-lookup-e2e.json), [escritorio](person-lookup-form.png), [móvil](person-lookup-mobile.png). Incluyen sesión/TOTP/origen,autocompletado/guardado/recarga,respuestas tardías,nombre manual,fallback404,DEMO sin consultas,edición sinconsulta,expediente con instantánea,denegaciónCaja,auditoría sin datos consultados y límite concurrente. Reporte final no representa nueva ejecución de las83regresiones históricas.

Mock solo en`tests/support/lookup-provider.mock.mjs`, inyectado por`node --import` en el procesoQA. Exige banderaQA,origenlocal3101 y carpetaQA. Token de prueba falso; no llamadas externas desde los E2E ni import del mock en fuentes de aplicación. No se abre ningún directorioPGlite desde scripts mientras tiene servidor propietario.

Se confirmó el contrato vigente en documentación primaria. [Prueba real](person-lookup-live.json): una consulta con el ejemplo público de documentación, nombre devuelto en622ms, sin persistir datos personales en fuentes/evidencia/base ni configurarTOTP del usuario. APIPERU_TOKEN configurado cifrado enVercel producción. No consulta de identidadRENIEC,biometría,SUNARP,firma oemisiónSUNAT.

Publicación verificadaREADY enVercel para fuente`d7d843a51310551cd6e883aabfa559094162908d`, despliegue`dpl_9UkqKMgi8CHriWCS6xarJNU18pmE`. [Comprobación del enlace canónico](person-lookup-deployment.json):accesoHTTPS200, código del nuevo formulario presente y consulta anónima401. No se accedió alTOTP del usuario ni se crearon fichas productivas para probar. La prueba real del proveedor y los E2EQA son verificaciones distintas, no una consulta autenticada del usuario final enproducción.

QA-01/02detenidas. Servicio principal original reabierto3100/PID19396, sesiónherramienta7300, sin cuentasQA en`.notaria/`. Token autorizado cargado en entorno del servicio local; una futura reapertura requiere configurar su variable de servidor. El valor persistente de publicación está cifrado enVercel.

Los scripts temporales y la copia local temporal del token se eliminan después de la publicación. Las capturas sonQA, no consultas de personas reales en producción.

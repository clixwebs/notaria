# ADR 0013 · Autocompletado de nombres por DNI

29/10/2026. El usuario solicitó que el número de documento complete los datos como en ElDial y autorizó expresamente **reutilizar únicamente APIPERU_TOKEN de ElDial**. Se leyó solo esa variable de la configuración de referencia, sin consultar otros valores, bases o datos de clientes y sin modificar ElDial. Esta excepción no autoriza reutilizar otras credenciales.

## Alcance autorizado

Alta de persona: DNI de ocho dígitos consulta nombres/apellidos al completar el número. El usuario revisa y guarda explícitamente la ficha; ninguna consulta crea personas o expedientes. CE, pasaporte y DEMO conservan captura manual. Editar una ficha existente no envía su DNI al proveedor automáticamente.

El código de referencia usa apiperu.dev. Se implementó el contrato vigente documentado [POST /dni](https://docs.apiperu.dev/referencia/consultar-dni/) en `https://api.apiperu.dev/dni`. Se reutiliza el proveedor y la credencial autorizada, sin copiar configuración o identidad del ERP retail. La credencial compartida consume la cuota de esa misma cuenta del proveedor.

El proveedor declara que no se conecta con RENIEC y que usa padrón reducido SUNAT y otras fuentes públicas. La respuesta no incluye necesariamente dirección, nacimiento, sexo o menores. NotariaOS recoge solo nombre completo/DNI, no promete todos los datos ni acredita identidad, capacidad, vigencia o validación biométrica. BK-24 y el adaptador de identificación notarial real siguen bloqueados, al igual que SUNARP, firma y emisión SUNAT reales.

## Controles

- Endpoint POST privado `people/lookup`, origen canónico, sesión/TOTP y permiso `people:write`; Caja sin acceso. Contrato estricto soloDNI/ocho dígitos.
- Token exclusivamente servidor mediante `APIPERU_TOKEN`; cifrado en Vercel solo producción, nunca `NEXT_PUBLIC`, respuesta, repositorio o preview. Host fijo, sin URL aportada por navegador, redirecciones rechazadas, timeout8s y respuesta máxima16KiB.
- Respuesta validada y DNI coincidente antes de completar nombre. Errores sin contenido bruto del proveedor; límite10solicitudes/minuto/usuario, durable mediante auditoría y bloqueo de fila de personal compartido por instancias. Registro de intento y resultado sin DNI, nombres o payload.
- Pausa700ms al escribir, cancelación al cambiar documento/cerrar formulario, descarte de respuestas anteriores y respeto de nombre editado manualmente durante la consulta. Reintento explícito, captura manual y guardado independiente ante fallos.
- No migraciones, cambios financieros, autorizaciones profesionales o acceso PLAFT. La ficha conserva su contrato e historial previo; los expedientes siguen congelando instantáneas.

## Validación

57unitarias,7escenarios API/navegador en baseQA nueva, build/TypeScript/lint correctos. Proveedor simulado solo mediante preimportación explícita del proceso QA, fuera de imports de la aplicación. Prueba real adicional con el ejemplo publicado por el proveedor: devuelve nombre, sin guardar DNI/nombres o crear registros en la base publicada. El autocompletado no sustituye preparación operativa ni identificación notarial.

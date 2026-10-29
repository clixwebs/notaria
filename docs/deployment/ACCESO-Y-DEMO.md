# Acceso y demostración de NotariaOS

Aplicación: [notariaos.vercel.app/acceso](https://notariaos.vercel.app/acceso).

La contraseña inicial está únicamente en el archivo local `.env.access.local`, en la línea **Contraseña inicial**. El archivo está excluido de Git. El correo es el confirmado por el usuario durante el alta. No hay contraseña prellenada ni registro público.

## Primera entrada

1. Abrir la aplicación e ingresar el correo y la contraseña inicial.
2. Se abre **Seguridad de tu cuenta**. Confirmar la misma contraseña y pulsar **Configurar segundo factor**.
3. En una aplicación autenticadora del teléfono, añadir una cuenta mediante **clave de configuración**. Introducir la clave que muestra NotariaOS; usar una cuenta TOTP **basada en tiempo**, con el nombre NotariaOS. Esta pantalla usa clave manual, no QR.
4. Copiar el código de seis dígitos que muestra el teléfono en **Código de seis dígitos** y pulsar **Verificar segundo factor**. Si el código acaba de cambiar, usar el nuevo. El teléfono debe tener fecha y hora automáticas.
5. Guardar los códigos de recuperación fuera de la aplicación y pulsar **Guardé mis códigos. Continuar**.
6. Cambiar la contraseña en Seguridad. En los siguientes ingresos se usa el código actual del teléfono; no existe un código TOTP fijo que pueda entregar el desarrollador. Un código de recuperación sirve una sola vez si se pierde el autenticador.

No compartir la cuenta administradora con el cliente. Para una presentación guiada puede usarse la sesión del administrador; crear acceso individual con el rol adecuado si el cliente necesita ingresar por su cuenta.

## Recorrido de la demostración

- **Dashboard y Expedientes:** nueve expedientes de compraventa, certificación de firmas y carta notarial, con requisitos pendientes, borradores y presupuestos aceptados o por aceptar.
- **Personas:** doce fichas ficticias, todas identificadas como DEMO.
- **Caja y cobros:** cobro completo y parcial, anticipo con aplicación parcial y custodia de terceros separada. Los importes son ficticios.
- **Tarifario:** seis conceptos de ejercicio, no precios aprobados por la notaría.
- **Archivo privado:** cuatro textos sintéticos, tres liberados y uno en cuarentena.
- **Fiscal:** dos documentos de simulación preparados con XML/QR, sin emisión o envío real.

El administrador conserva su perfil: no obtiene acceso PLAFT ni facultades profesionales del Notario. Las integraciones reales siguen deshabilitadas. Antes de operar con datos reales se necesita una base limpia independiente y las validaciones operativas pendientes.

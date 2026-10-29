# Fase 2 — Fundamentos para revisión local

29/10/2026 · NotariaOS 0.2.0 · Una sola notaría.

## Qué puedes revisar

Abrir [acceso local](http://127.0.0.1:3100/acceso). La instalación de revisión no contiene las cuentas de las pruebas. Crea tu cuenta administradora con una contraseña de doce caracteres o más, inicia sesión y configura una aplicación TOTP con la clave mostrada. Introduce el código de seis dígitos y guarda los diez códigos de recuperación antes de continuar.

El correo funciona como identificador; no se envía un mensaje ni se verifica su titularidad. Esta instalación local usa HTTP en loopback; el despliegue externo requerirá HTTPS, secreto gestionado y configuración operativa revisada.

1. **Personas:** registrar una ficha ficticia, editarla y recargar. Se conserva en la base. Dos ediciones sobre la misma revisión producen un conflicto, evitando sobrescribir un cambio silenciosamente. Vincular representante y representado con referencia del sustento; la suficiencia del poder no se decide automáticamente.
2. **Documentos / Más:** subir un TXT ficticio o PDF válido de hasta 5 MB para una persona. Queda en cuarentena. Administración o notario pueden registrar la revisión manual y liberar/rechazar. Una nueva versión mantiene las anteriores; la descarga vuelve a verificar permiso y estado.
3. **Configuración:** editar nombre de notaría/oficina; crear personal con perfil. Cambiar el perfil o deshabilitarlo revoca sus sesiones. No es posible quitarse a uno mismo la habilitación o el perfil desde esta pantalla.
4. **Seguridad:** desde el avatar o Configuración, cambiar contraseña y revocar otras sesiones. El código de recuperación permite superar el segundo factor una sola vez. No hay restablecimiento por correo conectado.
5. **Auditoría:** administración puede consultar accesos sensibles y cambios. El registro no expone el contenido del archivo ni credenciales.

Las acciones recientes vencen a los quince minutos desde la creación de la sesión. Si el servidor exige acceso reciente, cerrar sesión e ingresar nuevamente con segundo factor. Sesión general: ocho horas, sin renovación automática.

## Interfaz

Mismos componentes, proporciones, login y Montserrat de ELDIAL/Clix. Por la instrucción actual de André, se sustituyó el rojo por negro tinta `#0D1728`, azul `#174EA6`, superficies claras `#F4F6FA` y una variante oscura. Se conserva el video genérico de Clix, su control de pausa y el modo sin video en móvil/movimiento reducido.

La paleta anterior roja queda como evidencia histórica de fase 1. No se modificaron los proyectos de referencia.

## Alcance de esta fase

| Historia | Entrega local | Límite operativo |
| --- | --- | --- |
| BK-07 | Better Auth con TOTP, recuperación por códigos y revocación | Recuperación de contraseña por procedimiento/proveedor por completar |
| BK-08 | Sesiones, perfiles, permisos y oficina en servidor; acceso reciente | Perfiles notariales definitivos y revisión externa antes del piloto |
| BK-09 | PostgreSQL embebido, migraciones y configuración persistente | Servicio PostgreSQL de operación aún no ensayado |
| BK-10 | Archivo privado, versiones, tamaño/tipo, cuarentena y descarga | Liberación manual; antivirus y almacenamiento operativo pendientes |
| BK-11 | Auditoría transaccional y de lectura; rechazo de alteraciones | Retención, permisos DB de operación y controles externos pendientes |
| BK-12 | Personas, documento identificador y representación mínima | Vinculación al expediente e instantáneas jurídicas: fase 3 |

Personas, archivos, usuarios, configuración y auditoría son persistentes. **Expedientes, actuación, identificación, pagos y diligencias continúan como recorridos sintéticos en memoria.** La barra de entorno lo indica. No hay conexión real con RENIEC, SUNAT, SUNARP, firma o correo. La reserva específica de cumplimiento corresponde a fase 5.

## Adiasoft y Eureka dentro del plan

Se mantiene la [comparativa de oferta pública](../phase-1/comparativa-mercado.md) y el [backlog BK-33 a BK-42](../phase-1/backlog-ampliado.md). Sus capacidades económicas se incorporan al orden de ejecución, sin atribuirles un funcionamiento no probado:

| Entrega siguiente | Funciones que se integran | Dependencia de estos fundamentos |
| --- | --- | --- |
| Fase 3 | Expedientes persistentes, requisitos, revisión y presupuesto versionado/aceptado (BK-13–17/33) | Personas por ID, versiones privadas, permisos y auditoría |
| Fase 4 | Tarifas/cargos, anticipos, gastos por trámite, fondos para terceros, proveedores, conciliación y cuenta consolidada (BK-18–20/34–36) | Persona estable, transacciones, separación de honorarios/fondos y trazabilidad |
| Fase 7 | Agenda/portal, costos internos e indicadores explicables (BK-27–29/37–38) | Acceso por recurso y eventos persistentes |
| Fase 8 | Exportación/importación conciliada y soporte/recuperación (BK-31–32/39/41) | Archivo versionado y procedimientos de copia/restauración |

OCR/asistencia y consumibles permanecen opcionales. El CFDI que anuncia Eureka no se trata como evidencia de compatibilidad SUNAT. Los canales de identidad, firma y registro dependen de habilitaciones propias.

## Ejecución y recuperación

Desde el proyecto, `npm ci`, `npm run build`, `npm start`. La base y la clave local se crean bajo `.notaria/`, excluidas de Git. No publicar ni copiar esa carpeta como archivo público. No ejecutar dos servidores sobre el mismo directorio.

Para una copia local, **detener primero el servidor propietario**:

```powershell
npm run backup:local -- .notaria
npm run restore:local -- backups/local-<fecha> .notaria-restaurada-nueva
```

La copia contiene la base con archivos y la clave de autenticación; tratarla como información privada. La restauración crea un directorio nuevo, verifica checksum y no reemplaza una base existente. Para revisar la copia, iniciar un solo servidor con `NOTARIA_DATA_DIR` apuntando al nuevo directorio y conservar `NOTARIA_URL` correcto. Las sesiones conservan sus vencimientos originales.

Esto demuestra recuperación local básica; no establece RPO/RTO ni sustituye una política de respaldos, cifrado y permisos Windows/infraestructura.

## Verificación

Ver [evidencia de fase 2](../evidence/fase-2.md), pruebas JSON y capturas. Los archivos de fase 1 son históricos; la suite vigente es `tests/e2e/foundation.spec.ts` e incluye tres recorridos del prototipo bajo autenticación.

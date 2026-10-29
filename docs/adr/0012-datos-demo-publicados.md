# ADR 0012 · Datos ficticios para la demostración publicada

29/10/2026. Después del despliegue vacío, el usuario solicitó expresamente cargar información simulada en la misma base publicada para mostrarla al cliente. Esta autorización sustituye, para este conjunto de demostración, la decisión de mantener vacía la base alojada. No autoriza semillas en el arranque, cuentas QA en producción o datos en memoria.

## Decisión

Carga única y explícita mediante `scripts/seed-demo.ts`, desde terminal autorizada y con conexión PostgreSQL limitada. Exige objetivo QA/producción, hostname esperado, confirmación literal, administrador designado y variables externas; rechaza Vercel y migración automática. Antes de comenzar exige vacíos personas, expedientes, movimientos, tarifas y archivos. El bloqueo transaccional y el marcador de auditoría `demo-client-20261029-v1` permiten repetir el comando sin duplicar el conjunto. Un fallo revierte todos los registros; no hay borrado o reescritura del historial.

Reutiliza los comandos de dominio para expedientes, presupuestos, tarifas, caja y fiscal simulado dentro de una sola transacción. Personas y archivos respetan validación, huellas, cuarentena y auditoría del contrato existente. No modifica el código del runtime ni añade endpoints de carga.

Nombres, documentos, asuntos, conceptos, notas y referencias identificados como DEMO. Tipo documental DEMO, sin números reales de identidad. Archivos TXT generados con advertencia de ejercicio: tres liberados tras inspección del texto sintético, uno en cuarentena. No se declara revisión antivirus o jurídica.

Nueve expedientes con diferentes avances, seis tarifas, nueve presupuestos y siete aceptaciones ficticias. Se conservan importes decimales exactos y separación entre deuda, anticipos y terceros. Los dos XML/QR fiscales permanecen preparados en simulación, sin envío a SUNAT, firma o aceptación real.

No se crean cuentas, roles profesionales, autorizaciones notariales, evaluaciones PLAFT ni políticas jurídicas inventadas. No se cambia la contraseña ni se configura TOTP en nombre del usuario en producción. El TOTP de la copia QA se inscribe únicamente para verificar pantallas y permisos; usa secreto de entorno independiente.

## Validación y límites

Ensayo en rama Neon nueva, separada de producción y del QA anterior. Verificación de conteos, repetición, saldos exactos, bytes/huellas, cuarentena, inmutabilidad, login/TOTP de QA, reserva PLAFT, APIs y navegador Chrome. Evidencias en `docs/evidence/demo-*.json` y capturas DEMO. La cuenta de producción conserva TOTP pendiente para que el usuario lo configure en su dispositivo.

El alojamiento publicado queda dedicado a demostración. Antes de incorporar información operativa real debe prepararse una base vacía independiente y el procedimiento de transición; no borrar asientos o historial inmutable para reutilizar esta muestra. La base PGlite original no se modifica ni se abre desde scripts.

# Datos DEMO en la aplicación publicada

29/10/2026. Petición expresa posterior al despliegue: cargar información ficticia en la base alojada para presentar al cliente y explicar el acceso inicial. Decisión [ADR0012](../adr/0012-datos-demo-publicados.md); [guía de acceso y recorrido](../deployment/ACCESO-Y-DEMO.md).

## Ejecutado

Rama nueva Neon `qa-demo-20261029`, ID `br-holy-union-b5oxu5qk`, creada desde la producción todavía vacía de negocio. Secreto de autenticación QA independiente. Comando de carga externo `scripts/seed-demo.ts` mediante variables temporales ignoradas; nunca web ni migración. Reutiliza dominio y una sola transacción con marcador auditado y bloqueo de repetición. No abre PGlite.

La primera carga QA terminó correctamente. La latencia de muchas consultas secuenciales se investigó como posible espera; el proceso ya había finalizado cuando se intentó detenerlo, sin interrupción ni modificación de datos. La segunda ejecución confirmó repetición sin duplicados, cuyo resultado está en [demo-qa.json](demo-qa.json).

Resultados QA:12personas,9expedientes,9presupuestos,4archivos,6tarifas,16movimientos,2documentos fiscales preparados,1cuenta existente. Caja695.00;deuda2390.00;anticipos100.00;terceros150.00;gastos pendientes0.00, todos ficticios. Verificación de identidadesDEMO, hashes/bytes,3archivos liberados/1cuarentena, presupuestos/auditoría append-only, APIs de datos, contraseña y TOTP únicamente enQA, reservaPLAFT y pantallas. [Seis grupos correctos](demo-qa-verificacion.json). Primer intento visual falló por Chromium ausente; se utilizó Chrome ya instalado y finalizó sin errores de página. Capturas inspeccionadas: [Dashboard QA](demo-inicio.png), [Expedientes QA](demo-expedientes.png).

Después se ejecutó la misma carga en la base publicada. [Resultado producción](demo-production.json): iguales conteos/saldos, sin crear cuentas ni inscribirTOTP. [Verificación HTTPS y acceso](demo-production-verificacion.json):login200,contraseña inicial válida,anonimato401,datos403hastaTOTP,un solo marcador de carga,una cuenta administradora yTOTP pendiente. Se cerró la sesión de comprobación. No se inscribió autenticador por el usuario ni se obtuvo su claveTOTP.

TypeScript y lint del script correctos. No cambió código de la aplicación, esquema o controles de acceso. Las regresiones históricas83locales/52unitarias y8enfocadasNeon son antecedentes; no se presentan como nuevas pruebas ejecutadas en este cambio.

## Cierre y límites

Servidor QA3101/PID24608 detenido tras la verificación; ramaQA conservada como muestra desechable conTOTP propio. Principal local3100/PID24328 conservada y base`.notaria/` intacta. Los archivos temporales con credenciales y helpers de administración se eliminan al cierre; solo permanece`.env.access.local`, ignorado, para entregar la contraseña al usuario.

Integraciones reales, comunicaciones, SUNAT y formatos oficialesSBS/OCP siguen deshabilitados. No se inventan aprobaciones profesionales, actos notariales, ROS o políticas jurídicas. La demo no sustituye validación operativa y requiere una base limpia independiente antes del uso real; no borrar historia inmutable para limpiarla.

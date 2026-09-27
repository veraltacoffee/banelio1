# BANELIO — ESPECIFICACIÓN DE AUTENTICACIÓN REAL

## OBJETIVO

Reemplazar la autenticación falsa basada en localStorage por autenticación
real servidor-side usando Express + Prisma + bcryptjs + sesiones mediante
cookie HttpOnly.

NO implementar JWT.

NO almacenar tokens, contraseñas ni identidad autenticada en localStorage.

## PROYECTO

Este es el proyecto BANELIO existente:

/srv/banelio/project

NO modificar:
/srv/projects/experiments/pnlcs

NO migrar el proyecto a Laravel.

NO reconstruir el proyecto desde cero.

## BACKEND

Mantener Express + Prisma + SQLite actualmente.

Crear modelo Prisma Session relacionado con Customer.

La sesión debe utilizar:

- token aleatorio criptográficamente seguro
- hash SHA-256 del token almacenado en DB
- token original únicamente en cookie HttpOnly
- expiración
- createdAt
- lastSeenAt

Cookie:

- HttpOnly
- SameSite=Lax
- Path=/
- Secure únicamente cuando NODE_ENV=production
- Max-Age apropiado
- nunca exponer el token mediante JSON

## ENDPOINTS

Implementar:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

REGISTER:

- name obligatorio
- email obligatorio
- password obligatorio
- phone opcional
- nunca aceptar role desde el cliente
- siempre crear CUSTOMER
- password almacenada únicamente como bcrypt hash
- rechazar email duplicado
- crear sesión automáticamente después del registro

LOGIN:

- email + password
- buscar Customer por email
- verificar password con bcrypt
- rechazar passwordHash NULL
- respuesta genérica para credenciales inválidas
- crear sesión
- establecer cookie HttpOnly
- devolver solamente información pública del usuario autenticado
- nunca devolver passwordHash

ME:

- validar cookie
- buscar sesión
- validar expiración
- cargar Customer
- devolver usuario autenticado
- si no existe sesión válida devolver 401

LOGOUT:

- invalidar/eliminar la sesión actual
- limpiar cookie
- devolver éxito

## ROLES

La autorización debe depender EXCLUSIVAMENTE del Customer almacenado
en el backend.

Roles existentes:

PUBLIC
CUSTOMER
RESELLER
ADMIN

Nunca confiar en role enviado por React.

Nunca permitir que REGISTER establezca ADMIN o RESELLER.

## MIDDLEWARE

Crear middleware reutilizable para:

requireAuth
requireRole(...roles)

Debe permitir posteriormente proteger:

/api/orders/*
/dev
rutas administrativas
rutas de reseller

## SEGURIDAD

No utilizar localStorage para autenticación.

No utilizar sessionStorage para autenticación.

No aceptar credenciales administrativas desde el frontend como mecanismo
de autorización.

No crear contraseñas predeterminadas.

Eliminar cualquier fallback como:

BanelioSecure2026!

No registrar contraseñas ni tokens en logs.

Usar respuestas de error controladas.

## FRONTEND

Modificar AppContext para que:

- al iniciar la aplicación consulte GET /api/auth/me
- loginCustomer llame POST /api/auth/login
- registerCustomer llame POST /api/auth/register
- logoutCustomer llame POST /api/auth/logout
- no persista customerUser en localStorage
- no persista sesión/token en localStorage

La cookie debe ser gestionada automáticamente por el navegador.

Mantener localStorage solamente para preferencias, carrito u otros datos
que no representen autenticación.

## ADMIN

loginAdmin NO puede continuar concediendo acceso simplemente cambiando
estado React.

Debe utilizar el mismo backend de autenticación.

El backend debe comprobar:

Customer.role === ADMIN

El frontend solamente refleja el resultado del backend.

## PARTNER / RESELLER

No inventar todavía un sistema paralelo de autenticación.

No permitir que loginAffiliate conceda acceso por sí mismo.

Preparar la arquitectura para que RESELLER utilice la misma autenticación
server-side.

La persistencia completa de datos de partners/commissions será una fase
posterior.

## 2FA

No considerar la implementación actual del 2FA del frontend como seguridad
real.

No aceptar códigos arbitrarios de seis dígitos.

Si el código actual no puede conectarse todavía a una implementación
server-side real, dejarlo fuera de la autenticación efectiva y documentarlo
como pendiente.

## /dev

El endpoint /dev debe quedar protegido en producción por ADMIN.

En desarrollo puede conservarse accesible únicamente si NODE_ENV !== production.

## COMPATIBILIDAD

No romper:

- catálogo
- dominios
- pagos
- impuestos
- órdenes existentes
- UI pública
- carrito

No cambiar innecesariamente dependencias.

No instalar paquetes si puede resolverse utilizando las dependencias
existentes y APIs nativas de Node/Express.

## PRISMA

Crear migración formal para Session.

No modificar datos existentes destructivamente.

No borrar Customer, CatalogItem u Order.

## VALIDACIÓN FINAL

Después de implementar:

1. verificar TypeScript
2. verificar Prisma migration
3. verificar que register crea Customer con bcrypt hash
4. verificar login correcto
5. verificar login incorrecto
6. verificar /api/auth/me sin sesión
7. verificar /api/auth/me con sesión
8. verificar logout
9. verificar que un CUSTOMER no puede acceder a ADMIN
10. verificar que ADMIN sí puede acceder a /dev en producción
11. verificar que no quedan credenciales/tokens de autenticación en localStorage
12. verificar que no existe contraseña predeterminada

No ejecutar servidores públicos ni túneles.

No modificar PNLCS.

Antes de terminar, actualizar BANELIO_WORK_STATE.md con:

- archivos modificados
- migraciones realizadas
- decisiones
- validaciones
- pendientes
- estado para continuar

NO incluir secretos.

Al finalizar escribir exactamente:

YA TERMINÉ

ESTADO FINAL: TERMINADO/BLOQUEADO/EN PROGRESO

VALIDACIÓN:
[resumen breve de las validaciones realizadas]

# BANELIO RULES — Reglas Operativas Obligatorias

Estas reglas son obligatorias y estrictas para cualquier desarrollador, agente o cuenta de Google AI Studio que trabaje en el repositorio de **BANELIO**.

## 1. Entorno de trabajo y régimen de sincronización
1. **Entorno activo de desarrollo:** El proyecto actual en Google AI Studio es temporalmente el entorno activo de desarrollo de Banelio.
2. **Repositorio oficial:** GitHub `veraltacoffee/banelio1` continúa siendo el repositorio oficial del proyecto, pero su sincronización técnica queda temporalmente fuera del alcance de las tareas operativas cotidianas.
3. **No detener el trabajo por incidencias de GitHub:** El avance técnico NO se suspende ni bloquea por fallas o demoras de sincronización entre AI Studio y GitHub.
4. **Prohibido manipular GitHub sin instrucción expresa:** No intentar reparar, reconectar, desconectar o reconfigurar GitHub; no crear otro repositorio, no cambiar el repositorio y no crear ramas adicionales.
5. **Copia de seguridad en ZIP:** El archivo ZIP descargado de AI Studio constituye el respaldo de seguridad del estado actual.
6. **No eliminar ni sobrescribir archivos locales** bajo la premisa de que GitHub no refleje todavía las modificaciones.
7. **Veracidad documental:** NO considerar la sincronización de GitHub como criterio de finalización de una tarea, y NO afirmar que GitHub está sincronizado si no puede verificarse de forma directa.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión debe comenzar leyendo el contexto persistente oficial en este orden exacto:
1. `BANELIO_HANDOFF.md`
2. `BANELIO_RULES.md`
3. `BANELIO_WORK_STATE.md`
4. `BANELIO_TASKS.md`

Tras esta lectura, no releerlos completos y consultar únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Alcance y autorización de tareas
8. **Una tarea = un objetivo concreto.** No mezclar responsabilidades no relacionadas.
9. **Una conversación = una tarea lógica.** Al terminar la tarea, documentar y finalizar la sesión.
10. **Modificar únicamente archivos autorizados.** Solo se permite editar los archivos listados en `ALLOWED FILES` de la tarea.
11. **No iniciar tareas automáticamente:** Que una tarea aparezca como `PENDING` no autoriza su ejecución. Toda tarea requiere autorización explícita del usuario para comenzar.
12. **Lectura no autoriza modificación:** Las órdenes de "verificar", "analizar", "revisar" o "leer" son operaciones de solo lectura (READ-ONLY).
13. **No realizar trabajo adicional no solicitado.** Ceñirse con precisión quirúrgica a las instrucciones de la tarea asignada.
14. **No realizar "mejoras" preventivas o refactors no solicitados.**

## 4. Prohibiciones técnicas estrictas
15. **Prohibido ejecutar migraciones sin autorización:** No ejecutar `prisma migrate deploy`, `prisma db push`, ni modificar `prisma/schema.prisma` salvo instrucción explícita.
16. **Prohibido cambiar arquitectura sin autorización:** No alterar el runtime, framework ni stack.
17. **Prohibido inventar APIs, estados o respuestas:** Todo contrato debe basarse en endpoints e integraciones reales.
18. **Prohibido crear mocks o fallbacks en memoria** que reemplacen funciones o bases de datos reales.
19. **Prohibido exponer secretos** o credenciales en código frontend o archivos públicos.
20. **Prohibido modificar pagos, autenticación, ResellerClub o infraestructura** salvo asignación explícita de tarea.

## 5. Continuidad y cierre de tarea
21. **Actualización obligatoria de estado:** Toda tarea que modifique código debe actualizar `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md` y `BANELIO_HANDOFF.md`.
22. **Prioridad del código real:** Si existe discrepancia entre la documentación y el código, el código real en AI Studio tiene prioridad. Si existe discrepancia entre los documentos de continuidad, resolverla antes de modificar código.

# BANELIO RULES — Reglas Operativas Obligatorias

Estas reglas son obligatorias y estrictas para cualquier desarrollador, agente o cuenta de Google AI Studio que trabaje en el repositorio de **BANELIO**.

## 1. Rama de trabajo y fuente de verdad
1. **GitHub es la fuente de verdad.** El código en el repositorio GitHub `veraltacoffee/banelio1` prevalece sobre cualquier historial de conversación previa.
2. **`main` es la rama estable y la rama de trabajo actual.**
3. **Flujo de trabajo secuencial:** Las cuentas de AI Studio trabajan de forma secuencial directamente sobre `main`.
4. **No crear ramas adicionales** salvo que una tarea futura lo requiera de manera explícita.
5. **Ciclo de sincronización:** Cada cuenta realiza su tarea autorizada, valida, actualiza la documentación de continuidad y hace Push/Sync a GitHub para que la siguiente cuenta continúe desde allí.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión debe comenzar leyendo el contexto persistente oficial en este orden exacto:
1. `BANELIO_HANDOFF.md`
2. `BANELIO_RULES.md`
3. `BANELIO_WORK_STATE.md`
4. `BANELIO_TASKS.md`

Tras esta lectura, no releerlos completos y leer únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Alcance y autorización de tareas
6. **Una tarea = un objetivo concreto.** No mezclar responsabilidades no relacionadas.
7. **Una conversación = una tarea lógica.** Al terminar la tarea, documentar, sincronizar y finalizar la sesión.
8. **Modificar únicamente archivos autorizados.** Solo se permite editar los archivos listados en `ALLOWED FILES` de la tarea.
9. **No iniciar tareas automáticamente:** Que una tarea aparezca como `PENDING` no autoriza su ejecución. Toda tarea `PENDING` requiere autorización explícita del usuario para comenzar.
10. **Lectura no autoriza modificación:** Las órdenes de "verificar", "analizar", "revisar" o "leer" son operaciones READ-ONLY.

## 4. Prohibiciones técnicas estrictas
11. **Prohibido ejecutar migraciones sin autorización:** No ejecutar `prisma migrate deploy`, `prisma db push`, ni modificar `prisma/schema.prisma` salvo instrucción explícita.
12. **Prohibido cambiar arquitectura sin autorización:** No alterar el runtime, framework ni stack.
13. **Prohibido inventar APIs, estados o respuestas:** Todo contrato debe basarse en endpoints e integraciones reales.
14. **Prohibido crear mocks o fallbacks en memoria** que reemplacen funciones o bases de datos reales.
15. **Prohibido exponer secretos** o credenciales en código frontend o archivos públicos.
16. **Prohibido modificar pagos, autenticación, ResellerClub o infraestructura** salvo asignación explícita de tarea.
17. **Prohibido realizar "mejoras" preventivas o refactors no solicitados.**

## 5. Continuidad y cierre de tarea
18. **Actualización obligatoria de estado:** Toda tarea que modifique código debe actualizar `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md` y `BANELIO_HANDOFF.md`.
19. **Sincronización con GitHub:** Una tarea no se declara terminada hasta verificar el Push/Sync con GitHub. Si AI Studio no puede hacer Push directamente, se debe reportar `PUSH PENDIENTE`.
20. **Prioridad del código real:** Si existe discrepancia entre la documentación y el código, el código real de GitHub tiene prioridad. Si existe discrepancia entre los documentos de continuidad, resolverla antes de modificar código.

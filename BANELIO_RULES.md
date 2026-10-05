# BANELIO RULES — Reglas Operativas Obligatorias

Estas reglas son obligatorias y estrictas para cualquier desarrollador, agente o cuenta de Google AI Studio que trabaje en el repositorio de **BANELIO**.

## 1. Rama de trabajo y fuente de verdad
1. **GitHub es la fuente de verdad.** El código en el repositorio GitHub `veraltacoffee/banelio1` prevalece sobre cualquier historial de conversación previa.
2. **`main` es actualmente la rama estable y fuente de verdad de Banelio.** Las cuentas de AI Studio trabajan secuencialmente sobre el mismo repositorio y sincronizan sus cambios mediante GitHub.
3. **No crear ramas adicionales** salvo autorización explícita para una tarea concreta.
4. **Ciclo de sincronización:** Cada cuenta realiza su tarea autorizada, valida, actualiza la documentación de continuidad y sincroniza sus cambios mediante GitHub para que la siguiente cuenta continúe desde allí.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión debe comenzar leyendo el contexto persistente oficial en este orden exacto:
1. `BANELIO_HANDOFF.md`
2. `BANELIO_RULES.md`
3. `BANELIO_WORK_STATE.md`
4. `BANELIO_TASKS.md`

Tras esta lectura, no releerlos completos y leer únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Alcance y autorización de tareas
5. **Una tarea = un objetivo concreto.** No mezclar responsabilidades no relacionadas.
6. **Una conversación = una tarea lógica.** Al terminar la tarea, documentar, sincronizar y finalizar la sesión.
7. **Modificar únicamente archivos autorizados.** Solo se permite editar los archivos listados en `ALLOWED FILES` de la tarea.
8. **No iniciar tareas automáticamente:** Que una tarea aparezca como `PENDING` no autoriza su ejecución. Toda tarea `PENDING` requiere autorización explícita del usuario para comenzar.
9. **Lectura no autoriza modificación:** Las órdenes de "verificar", "analizar", "revisar" o "leer" son operaciones READ-ONLY.
10. **No realizar trabajo adicional no solicitado.** Ceñirse con precisión quirúrgica a las instrucciones de la tarea asignada.
11. **No realizar "mejoras" preventivas o refactors no solicitados.**

## 4. Prohibiciones técnicas estrictas
12. **Prohibido ejecutar migraciones sin autorización:** No ejecutar `prisma migrate deploy`, `prisma db push`, ni modificar `prisma/schema.prisma` salvo instrucción explícita.
13. **Prohibido cambiar arquitectura sin autorización:** No alterar el runtime, framework ni stack.
14. **Prohibido inventar APIs, estados o respuestas:** Todo contrato debe basarse en endpoints e integraciones reales.
15. **Prohibido crear mocks o fallbacks en memoria** que reemplacen funciones o bases de datos reales.
16. **Prohibido exponer secretos** o credenciales en código frontend o archivos públicos.
17. **Prohibido modificar pagos, autenticación, ResellerClub o infraestructura** salvo asignación explícita de tarea.

## 5. Continuidad y cierre de tarea
18. **Actualización obligatoria de estado:** Toda tarea que modifique código debe actualizar `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md` y `BANELIO_HANDOFF.md`.
19. **Sincronización con GitHub:** Una tarea se declara completada una vez validada, documentada y sincronizada con GitHub `main`.
20. **Prioridad del código real:** Si existe discrepancia entre la documentación y el código, el código real de GitHub tiene prioridad. Si existe discrepancia entre los documentos de continuidad, resolverla antes de modificar código.

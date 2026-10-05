# BANELIO RULES — Reglas Operativas Obligatorias

Estas reglas son obligatorias y estrictas para cualquier desarrollador, agente o sesión de Google AI Studio que trabaje en el repositorio de **BANELIO**.

1. **GitHub es la fuente de verdad.** El código de GitHub `veraltacoffee/banelio1` prevalece sobre cualquier memoria de conversación previa.
2. **`main` es la rama estable.** Todo cambio debe respetar la integridad de esta rama.
3. **No modificar `main` directamente cuando exista una rama de trabajo disponible.**
4. **Una tarea = un objetivo concreto.** No mezclar múltiples responsabilidades en una misma tarea.
5. **Una conversación = una tarea lógica.** Al terminar una tarea, documentar, sincronizar y finalizar la conversación.
6. **No modificar archivos fuera del alcance autorizado.** Solo se pueden modificar los archivos explícitamente listados en los `ALLOWED FILES` de la tarea.
7. **No ejecutar migraciones sin autorización.** Queda terminantemente prohibido ejecutar `prisma migrate deploy`, `prisma db push` o alterar `prisma/schema.prisma` sin autorización explícita.
8. **No cambiar arquitectura sin autorización.** No alterar el stack, runtime ni flujo de servicios.
9. **No inventar APIs, estados o resultados.** Toda integración debe responder a contratos reales.
10. **No crear mocks para reemplazar funciones reales.** Ni proxies en memoria ni simulaciones de base de datos o APIs.
11. **No exponer secretos.** No colocar credenciales, claves privadas o tokens en frontend ni en repositorios.
12. **No modificar pagos, autenticación, ResellerClub o producción sin autorización explícita.**
13. **Toda tarea terminada debe actualizar los archivos de continuidad.** (`BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`, `BANELIO_HANDOFF.md`).
14. **Toda tarea terminada debe sincronizarse con GitHub.**
15. **Una tarea no está terminada hasta comprobar el estado de GitHub.** Si el push no puede realizarse, reportar `PUSH PENDIENTE`.
16. **Si existe conflicto entre documentación y código, el código real tiene prioridad.**
17. **Si existe conflicto entre documentos de continuidad, detenerse y resolverlo antes de modificar código.**
18. **Las respuestas deben ser concretas y breves.** Cero relleno, cero explicaciones narrativas innecesarias.
19. **No realizar trabajo adicional no solicitado.** Ceñirse con precisión quirúrgica a las instrucciones de la tarea.
20. **No realizar "mejoras" espontáneas.** No hacer refactorizaciones preventivas, correcciones estéticas ni modificaciones secundarias fuera del alcance.

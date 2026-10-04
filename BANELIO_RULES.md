# BANELIO RULES — Reglas Operativas Obligatorias

Estas reglas son mandatorias para cualquier desarrollador, agente o sesión de Google AI Studio que trabaje en el repositorio de **BANELIO**.

1. The repository is the source of truth.
2. Never depend on previous AI Studio conversation history.
3. Before starting any task, read:
   - `BANELIO_RULES.md`
   - `BANELIO_WORK_STATE.md`
   - `BANELIO_TASKS.md`
4. Only modify files required for the assigned task.
5. Never overwrite unrelated work.
6. Never delete functionality without global dependency analysis.
7. Never invent APIs.
8. Never invent payment states.
9. Never invent ResellerClub responses.
10. Never expose credentials.
11. Never put secrets in frontend code.
12. Never replace real functionality with mocks.
13. Never report PASS without actually running the corresponding validation.
14. After EVERY completed task update `BANELIO_WORK_STATE.md`.
15. After EVERY completed task update `BANELIO_TASKS.md`.
16. Every completed task must record:
    - files modified
    - files created
    - files deleted
    - validation performed
    - results
    - remaining problems
    - next task
17. Never modify `main` unless explicitly authorized.
18. Work must be performed on the assigned Git branch.
19. If another worker's changes are detected, do not overwrite them.
20. If a Git conflict exists, stop and report it.
21. Production-critical systems must not be changed outside the assigned scope.
22. Never delete database models without verifying all references.
23. Never execute destructive database commands without explicit authorization.
24. Never execute:
    - `prisma migrate reset`
    - `DROP`
    - `TRUNCATE`
    - `DELETE` against production data
    without explicit authorization.
25. Before completing any task run the validations appropriate to the files modified.
26. `BANELIO_WORK_STATE.md` is mandatory handoff documentation.
27. The next AI Studio account must be able to continue using only the repository and these documentation files.

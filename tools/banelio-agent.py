#!/usr/bin/env python3

import json
import os
import re
import shutil
import ast
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path
PROJECT = "/srv/banelio/project"
TASK_FILE = "/srv/banelio/tasks/TASK.md"
LOG_DIR = "/srv/banelio/logs"

OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions"
MODEL = "banelio-coder:14b"

MAX_FILE_SIZE = 200000
MAX_PLAN_WRITE_BYTES = 2000000
MAX_OPERATIONS = 20
MAX_CONTEXT_FILES = 6
MAX_CONTEXT_CHARS = 8000
SYSTEM = """Eres el analista técnico del proyecto BANELIO.

Analiza únicamente la información real recibida en relevant_files y TASK.md.

NO ejecutes comandos.
NO inventes archivos.
NO inventes contenido existente.
NO uses rutas absolutas.
NO uses comandos de shell.
NO modifiques archivos fuera de relevant_files.

Devuelve ÚNICAMENTE un objeto JSON válido.

Formato:

{
  "status": "PLAN",
  "summary": "resumen",
  "files": [
    {
      "path": "ruta real",
      "reason": "motivo",
      "change": "cambio propuesto"
    }
  ],
  "operations": [
    {
      "action": "replace",
      "path": "ruta real",
      "old": "texto exacto existente",
      "new": "texto nuevo"
    }
  ],
  "risks": [],
  "validation": []
}

Las únicas acciones permitidas son:

1. replace
{
  "action": "replace",
  "path": "ruta real existente",
  "old": "texto exacto existente",
  "new": "reemplazo"
}

2. create_file
{
  "action": "create_file",
  "path": "ruta nueva dentro del proyecto",
  "content": "contenido completo del archivo"
}

3. delete_file
{
  "action": "delete_file",
  "path": "ruta real existente"
}

Reglas de seguridad:

- replace: old debe ser texto exacto proporcionado y aparecer exactamente UNA vez.
- create_file: solo puede crear un archivo dentro del proyecto y no debe existir previamente.
- delete_file: solo puede eliminar un archivo que exista en relevant_files.
- path nunca puede ser absoluto.
- path nunca puede contener "..".
- No inventes rutas.
- No inventes archivos que no estén justificados por TASK.md.
- Si no existe un cambio seguro y exacto, devuelve operations como [].
- Si TASK.md contiene una restricción explícita, respétala.
- No cambies package.json, package-lock.json ni bun.lock cuando TASK.md indique que no se debe cambiar el nombre del paquete.
"""


def run_git(*args):
    result = subprocess.run(
        ["git", "-C", PROJECT, *args],
        capture_output=True,
        text=True,
        timeout=30
    )
    return result.stdout.strip()


def safe_path(relative):
    root = os.path.realpath(PROJECT)
    target = os.path.realpath(os.path.join(root, relative))

    if target != root and not target.startswith(root + os.sep):
        raise RuntimeError("Ruta fuera del proyecto: " + relative)

    return target


def find_relevant_files(term):
    stopwords = {
        "para", "que", "del", "las", "los", "una", "uno", "con",
        "por", "como", "solo", "solo", "este", "esta", "desde",
        "sobre", "entre", "debe", "deben", "archivo", "archivos",
        "modificar", "modifique", "crear", "creado", "eliminar",
        "realizar", "hacer", "tarea", "proyecto", "banelio"
    }

    raw_tokens = re.findall(r"[a-zA-Z0-9_./-]{3,}", term.lower())

    tokens = []
    for token in raw_tokens:
        if token in stopwords:
            continue
        if token not in tokens:
            tokens.append(token)

    if not tokens:
        tokens = ["banelio"]

    matches = []

    for root, dirs, names in os.walk(PROJECT):
        dirs[:] = [
            d for d in dirs
            if d not in {".git", "node_modules", ".cache", "dist", "build"}
        ]

        for name in names:
            full = os.path.join(root, name)
            rel = os.path.relpath(full, PROJECT).replace(os.sep, "/")

            lower_rel = rel.lower()
            if (
                lower_rel == ".env"
                or lower_rel.startswith(".env.")
                or lower_rel.endswith((".pem", ".key"))
                or any(
                    marker in lower_rel
                    for marker in (
                        "secret",
                        "credential",
                        "password",
                    )
                )
            ):
                continue

            try:
                size = os.path.getsize(full)
            except OSError:
                continue

            if size > MAX_FILE_SIZE:
                continue

            try:
                with open(full, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except OSError:
                continue

            lower_content = content.lower()
            lower_name = rel.lower()

            score = 0
            hits = []

            for token in tokens:
                name_hits = lower_name.count(token)
                content_hits = lower_content.count(token)

                score += name_hits * 10
                score += min(content_hits, 20)

                if name_hits or content_hits:
                    index = lower_content.find(token)

                    if index >= 0:
                        line_number = lower_content[:index].count("\n") + 1
                        lines = content.splitlines(keepends=True)
                        start_line = max(0, line_number - 6)
                        end_line = min(len(lines), line_number + 5)

                        hits.append({
                            "token": token,
                            "line": line_number,
                            "context": "".join(
                                lines[start_line:end_line]
                            )
                        })

            if score > 0:
                matches.append({
                    "path": rel,
                    "size": size,
                    "score": score,
                    "matches": hits[:10]
                })

    matches.sort(
        key=lambda item: (
            -item["score"],
            item["path"]
        )
    )

    return matches

def call_ollama(user_content):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user_content}
        ],
        "stream": False,
        "temperature": 0,
        "max_tokens": 1536
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(request, timeout=300) as response:
        data = json.load(response)

    return data["choices"][0]["message"]["content"]


def parse_json(raw):
    candidate = raw.strip()

    if candidate.startswith("```"):
        lines = candidate.splitlines()

        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        candidate = "\n".join(lines).strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()

        start = candidate.find("{")

        if start < 0:
            raise RuntimeError(
                "El modelo no devolvió ningún objeto JSON"
            )

        try:
            value, _ = decoder.raw_decode(candidate[start:])
            return value
        except json.JSONDecodeError as e:
            raise RuntimeError(
                "El modelo devolvió contenido, pero no JSON válido: "
                + str(e)
            )



def validate_operations(plan, relevant):
    errors = []

    if not isinstance(plan, dict):
        return ["PLAN_NO_ES_OBJETO"]

    operations = plan.get("operations", [])

    if not isinstance(operations, list):
        return ["OPERATIONS_NO_ES_LISTA"]

    if len(operations) > MAX_OPERATIONS:
        return [
            f"OPERACIONES_EXCEDEN_MAXIMO:{len(operations)}:MAX={MAX_OPERATIONS}"
        ]

    allowed_paths = {
        item["path"]
        for item in relevant
        if isinstance(item, dict) and isinstance(item.get("path"), str)
    }

    total_write_bytes = 0
    seen_paths = set()

    for index, operation in enumerate(operations):
        prefix = f"OPERACION_{index}"

        if not isinstance(operation, dict):
            errors.append(f"{prefix}:NO_ES_OBJETO")
            continue

        action = operation.get("action")

        if action not in {"replace", "create_file", "delete_file"}:
            errors.append(f"{prefix}:ACCION_NO_PERMITIDA")
            continue

        path = operation.get("path")

        if not isinstance(path, str) or not path:
            errors.append(f"{prefix}:RUTA_INVALIDA")
            continue

        if path in seen_paths:
            errors.append(f"{prefix}:RUTA_DUPLICADA:{path}")
        else:
            seen_paths.add(path)

        if path.startswith("/") or ".." in Path(path).parts:
            errors.append(f"{prefix}:RUTA_INSEGURA:{path}")
            continue

        if action in {"replace", "delete_file"} and path not in allowed_paths:
            errors.append(f"{prefix}:ARCHIVO_NO_AUTORIZADO:{path}")

        if action == "replace":
            old = operation.get("old")
            new = operation.get("new")

            if not isinstance(old, str):
                errors.append(f"{prefix}:OLD_INVALIDO:{path}")
            elif old == "":
                errors.append(f"{prefix}:OLD_VACIO:{path}")

            if not isinstance(new, str):
                errors.append(f"{prefix}:NEW_INVALIDO:{path}")
            else:
                new_bytes = len(new.encode("utf-8"))

                if new_bytes > MAX_FILE_SIZE:
                    errors.append(
                        f"{prefix}:NEW_EXCEDE_MAX_FILE_SIZE:{path}"
                    )

                total_write_bytes += new_bytes

        elif action == "create_file":
            content = operation.get("content")

            if not isinstance(content, str):
                errors.append(f"{prefix}:CONTENT_INVALIDO:{path}")
            else:
                content_bytes = len(content.encode("utf-8"))

                if content_bytes > MAX_FILE_SIZE:
                    errors.append(
                        f"{prefix}:CONTENT_EXCEDE_MAX_FILE_SIZE:{path}"
                    )

                total_write_bytes += content_bytes

            if path in allowed_paths:
                errors.append(f"{prefix}:CREATE_ARCHIVO_YA_REFERENCIADO:{path}")

    if total_write_bytes > MAX_PLAN_WRITE_BYTES:
        errors.append(
            f"PLAN_EXCEDE_MAX_WRITE_BYTES:{total_write_bytes}:MAX={MAX_PLAN_WRITE_BYTES}"
        )

    return sorted(set(errors))


def validate_replace_content(plan, project_root):
    errors = []

    if not isinstance(plan, dict):
        return ["PLAN_NO_ES_OBJETO"]

    operations = plan.get("operations", [])

    if not isinstance(operations, list):
        return ["OPERATIONS_NO_ES_LISTA"]

    root = Path(project_root).resolve()

    for index, operation in enumerate(operations):
        prefix = f"OPERACION_{index}"

        if not isinstance(operation, dict):
            errors.append(f"{prefix}:NO_ES_OBJETO")
            continue

        if operation.get("action") != "replace":
            continue

        path = operation.get("path")

        if not isinstance(path, str) or not path:
            continue

        target = (root / path).resolve()

        try:
            target.relative_to(root)
        except ValueError:
            errors.append(f"{prefix}:RUTA_FUERA_DEL_PROYECTO:{path}")
            continue

        if not target.is_file():
            errors.append(f"{prefix}:ARCHIVO_NO_EXISTE:{path}")
            continue

        old = operation.get("old")

        if not isinstance(old, str) or old == "":
            continue

        content = target.read_text(encoding="utf-8")

        occurrences = content.count(old)

        if occurrences == 0:
            errors.append(f"{prefix}:OLD_NO_ENCONTRADO:{path}")

        elif occurrences > 1:
            errors.append(
                f"{prefix}:OLD_NO_UNICO:{path}:OCURRENCIAS={occurrences}"
            )

        else:
            new = operation.get("new")

            if isinstance(new, str):
                new_content = content.replace(old, new, 1)

                if len(new_content.encode("utf-8")) > MAX_FILE_SIZE:
                    errors.append(
                        f"{prefix}:RESULTADO_EXCEDE_MAX_FILE_SIZE:{path}"
                    )

    return sorted(set(errors))

def validate_applied_changes(project_root, changed_paths=None, operations=None):
    root = Path(project_root).resolve()

    if changed_paths is None:
        changed_paths = []

    if operations is None:
        operations = []

    errors = []
    validations = []

    # 1. Validación universal de Git.
    result = subprocess.run(
        ["git", "diff", "--check"],
        cwd=root,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        detail = (result.stdout + result.stderr).strip()
        raise RuntimeError(
            "VALIDACION_GIT_DIFF_CHECK_FALLIDA:"
            + (detail or "sin detalle")
        )

    validations.append("git diff --check: OK")

    # 2. Validación de existencia según la operación.
    for operation in operations:
        action = operation.get("action")
        relative_path = operation.get("path")

        if not relative_path:
            continue

        target = root / relative_path

        if action == "delete_file":
            if target.exists():
                errors.append(
                    f"DELETE_NO_CONFIRMADO:{relative_path}"
                )
            else:
                validations.append(
                    f"delete:{relative_path}:OK"
                )

        elif action in {"create_file", "replace"}:
            if not target.is_file():
                errors.append(
                    f"ARCHIVO_NO_EXISTE:{relative_path}"
                )
            else:
                validations.append(
                    f"archivo:{relative_path}:OK"
                )

    # 3. Validación semántica obligatoria de REPLACE.
    for operation in operations:
        if operation.get("action") != "replace":
            continue

        relative_path = operation.get("path")
        old = operation.get("old")
        new = operation.get("new")

        if not relative_path or old is None or new is None:
            errors.append(
                f"REPLACE_OPERACION_INVALIDA:{relative_path}"
            )
            continue

        target = root / relative_path

        if not target.is_file():
            errors.append(
                f"REPLACE_ARCHIVO_NO_EXISTE:{relative_path}"
            )
            continue

        try:
            content = target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(
                f"REPLACE_LECTURA_FALLIDA:{relative_path}:{exc}"
            )
            continue

        if old in content:
            errors.append(
                f"REPLACE_OLD_AUN_PRESENTE:{relative_path}"
            )

        if new not in content:
            errors.append(
                f"REPLACE_NEW_NO_ENCONTRADO:{relative_path}"
            )

        if old not in content and new in content:
            validations.append(
                f"replace:{relative_path}:OK"
            )

    # 3. Validación específica de Python.
    python_files = set()

    for relative_path in changed_paths:
        if str(relative_path).lower().endswith(".py"):
            python_files.add(str(relative_path))

    for operation in operations:
        relative_path = operation.get("path")
        if (
            relative_path
            and str(relative_path).lower().endswith(".py")
            and operation.get("action") != "delete_file"
        ):
            python_files.add(str(relative_path))

    for relative_path in sorted(python_files):
        target = root / relative_path

        if not target.is_file():
            continue

        try:
            source = target.read_text(encoding="utf-8")
            ast.parse(source, filename=str(target))
        except (SyntaxError, UnicodeDecodeError) as exc:
            detail = str(exc).strip()
            errors.append(
                "PYTHON_SYNTAX_FALLIDA:"
                + relative_path
                + ":"
                + (detail or "sin detalle")
            )
        else:
            validations.append(
                f"python:{relative_path}:OK"
            )

    # 4. Validación específica de JSON.
    json_files = set()

    for relative_path in changed_paths:
        if str(relative_path).lower().endswith(".json"):
            json_files.add(str(relative_path))

    for operation in operations:
        relative_path = operation.get("path")
        if (
            relative_path
            and str(relative_path).lower().endswith(".json")
            and operation.get("action") != "delete_file"
        ):
            json_files.add(str(relative_path))

    for relative_path in sorted(json_files):
        target = root / relative_path

        if not target.is_file():
            continue

        try:
            import json

            with target.open("r", encoding="utf-8") as handle:
                json.load(handle)

            validations.append(
                f"json:{relative_path}:OK"
            )

        except Exception as error:
            errors.append(
                "JSON_INVALIDO:"
                + relative_path
                + ":"
                + str(error)
            )

    if errors:
        raise RuntimeError(
            "VALIDACION_APLICADA_FALLIDA:"
            + " | ".join(errors)
        )

    return " | ".join(validations)


def apply_operations(plan, project_root):
    operations = plan.get("operations", [])

    root = Path(project_root).resolve()
    prepared = []

    for index, operation in enumerate(operations):
        action = operation["action"]
        path = operation["path"]
        target = (root / path).resolve()

        try:
            target.relative_to(root)
        except ValueError:
            raise RuntimeError(
                f"OPERACION_{index}:RUTA_FUERA_DEL_PROYECTO:{path}"
            )

        if action == "replace":
            if not target.is_file():
                raise RuntimeError(
                    f"OPERACION_{index}:ARCHIVO_NO_EXISTE:{path}"
                )

            old = operation["old"]
            new = operation["new"]
            content = target.read_text(encoding="utf-8")
            occurrences = content.count(old)

            if occurrences != 1:
                raise RuntimeError(
                    f"OPERACION_{index}:OLD_NO_UNICO:{path}:"
                    f"OCURRENCIAS={occurrences}"
                )

            prepared.append({
                "action": action,
                "path": path,
                "target": target,
                "original": content,
                "updated": content.replace(old, new, 1)
            })

        elif action == "create_file":
            if target.exists():
                raise RuntimeError(
                    f"OPERACION_{index}:ARCHIVO_YA_EXISTE:{path}"
                )

            prepared.append({
                "action": action,
                "path": path,
                "target": target,
                "original": None,
                "updated": operation["content"]
            })

        elif action == "delete_file":
            if not target.is_file():
                raise RuntimeError(
                    f"OPERACION_{index}:ARCHIVO_NO_EXISTE:{path}"
                )

            prepared.append({
                "action": action,
                "path": path,
                "target": target,
                "original": target.read_text(encoding="utf-8"),
                "updated": None
            })

        else:
            raise RuntimeError(
                f"OPERACION_{index}:ACCION_NO_PERMITIDA:{action}"
            )

    backup_root = Path("/srv/banelio/backups")
    backup_root.mkdir(parents=True, exist_ok=True)

    backup_dir = backup_root / (
        "agent-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    )
    backup_dir.mkdir(parents=True, exist_ok=False)

    for item in prepared:
        if item["action"] in {"replace", "delete_file"}:
            backup_target = backup_dir / item["path"]
            backup_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item["target"], backup_target)

    print("RESPALDO_PREVIO:", backup_dir)

    try:
        for item in prepared:
            if item["action"] == "delete_file":
                item["target"].unlink()
            else:
                item["target"].parent.mkdir(parents=True, exist_ok=True)
                item["target"].write_text(
                    item["updated"],
                    encoding="utf-8"
                )

        validation = validate_applied_changes(
            project_root,
            changed_paths=[item["path"] for item in prepared],
            operations=operations
        )

        if not validation:
            raise RuntimeError("VALIDACION_FALLIDA")

    except Exception as error:
        rollback_errors = []

        for item in reversed(prepared):
            try:
                if item["action"] == "create_file":
                    item["target"].unlink(missing_ok=True)
                else:
                    item["target"].parent.mkdir(parents=True, exist_ok=True)
                    item["target"].write_text(
                        item["original"],
                        encoding="utf-8"
                    )
            except Exception as rollback_error:
                rollback_errors.append(
                    f"{item['path']}:{rollback_error}"
                )

        if rollback_errors:
            raise RuntimeError(
                "ESCRITURA_FALLO_ROLLBACK_INCOMPLETO:"
                + "|".join(rollback_errors)
            ) from error

        raise RuntimeError(
            "ESCRITURA_FALLIDA_ROLLBACK_OK"
        ) from error

    return [
        item["path"]
        for item in prepared
    ]


def validate_plan(plan, relevant, task_text):
    errors = []

    if not isinstance(plan, dict):
        return ["PLAN_NO_ES_OBJETO"]

    if plan.get("status") not in {"PLAN", "NO_CHANGE", "BLOCKED"}:
        errors.append("STATUS_INVALIDO")

    files = plan.get("files", [])

    if not isinstance(files, list):
        errors.append("FILES_NO_ES_LISTA")
        return sorted(set(errors))

    allowed_paths = {
        item["path"]
        for item in relevant
        if isinstance(item, dict) and isinstance(item.get("path"), str)
    }

    task_lower = task_text.lower()

    if "no cambies el nombre del paquete" in task_lower:
        forbidden_paths = {
            "package.json",
            "package-lock.json",
            "bun.lock",
        }

        for item in files:
            if not isinstance(item, dict):
                errors.append("ELEMENTO_FILES_INVALIDO")
                continue

            path = str(item.get("path", ""))
            change = str(item.get("change", "")).lower()

            if path in forbidden_paths:
                errors.append(f"ARCHIVO_PROHIBIDO:{path}")

            forbidden_phrases = (
                "cambiar el nombre del paquete",
                "cambiar nombre del paquete",
                "modificar el nombre del paquete",
                "modificar nombre del paquete",
            )

            if any(phrase in change for phrase in forbidden_phrases):
                errors.append(f"CAMBIO_PROHIBIDO:{path}")

    for item in files:
        if not isinstance(item, dict):
            continue

        path = str(item.get("path", ""))

        if not path:
            errors.append("RUTA_VACIA")
            continue

        if path.startswith("/") or ".." in Path(path).parts:
            errors.append(f"RUTA_INSEGURA:{path}")
            continue

        create_paths = {
            operation.get("path")
            for operation in plan.get("operations", [])
            if isinstance(operation, dict)
            and operation.get("action") == "create_file"
            and isinstance(operation.get("path"), str)
        }

        if path not in allowed_paths and path not in create_paths:
            errors.append(f"ARCHIVO_NO_AUTORIZADO:{path}")

    return sorted(set(errors))

def update_work_state(status, objective="", detail=""):
    project_root = Path(PROJECT).resolve()
    work_state = project_root / "BANELIO_WORK_STATE.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    safe_objective = str(objective).replace("\n", " ").strip()
    safe_detail = str(detail).replace("\n", " ").strip()

    # Evitar registrar contenido que pueda contener credenciales.
    secret_markers = [
        "API_KEY",
        "APIKEY",
        "PASSWORD",
        "SECRET",
        "TOKEN",
        "AUTHORIZATION",
        "PRIVATE_KEY",
    ]

    if any(marker.lower() in safe_objective.lower() for marker in secret_markers):
        safe_objective = "[OBJETIVO_OMITIDO_POR_SEGURIDAD]"

    if any(marker.lower() in safe_detail.lower() for marker in secret_markers):
        safe_detail = "[DETALLE_OMITIDO_POR_SEGURIDAD]"

    with work_state.open("a", encoding="utf-8") as f:
        f.write(
            f"\n## ESTADO AUTOMATICO — {timestamp}\n"
            f"- Estado: `{status}`\n"
            f"- Objetivo: `{safe_objective}`\n"
        )

        if safe_detail:
            f.write(
                f"- Detalle: `{safe_detail}`\n"
            )


def main():
    os.makedirs(LOG_DIR, exist_ok=True)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_file = os.path.join(LOG_DIR, f"agent-{stamp}.log")

    if not os.path.isfile(TASK_FILE):
        raise RuntimeError("No existe TASK.md")

    with open(TASK_FILE, "r", encoding="utf-8") as f:
        task = f.read().strip()

    if not task:
        raise RuntimeError("TASK.md está vacío")

    initial_objective_match = re.search(
        r"(?ims)^\s*OBJETIVO\s*:\s*(.*?)(?=^\s*TIPO\s*:|^\s*OPERACION\s*:|^\s*REGLAS\s*:|\Z)",
        task
    )

    initial_objective = (
        initial_objective_match.group(1).strip()
        if initial_objective_match
        else task[:200]
    )


    mode_match = re.search(r"(?im)^\s*MODO\s*:\s*(.+?)\s*$", task)
    type_match = re.search(r"(?im)^\s*TIPO\s*:\s*(.+?)\s*$", task)

    mode = mode_match.group(1).strip().upper() if mode_match else "PLAN"
    task_type = type_match.group(1).strip().upper() if type_match else ""

    if mode not in {"PLAN", "APPLY", "AUTO"}:
        raise RuntimeError("MODO_INVALIDO: " + mode)

    waiting_objectives = {
        "ESPERAR LA SIGUIENTE TAREA DE BANELIO.",
        "ESPERAR LA SIGUIENTE TAREA DE BANELIO",
    }

    normalized_objective = " ".join(
        initial_objective.strip().upper().split()
    )

    if normalized_objective in waiting_objectives:
        update_work_state(
            "EN ESPERA",
            "Esperando una tarea real de BANELIO.",
            "Ollama omitido: TASK.md no contiene una tarea ejecutable."
        )
        print("ESTADO: EN ESPERA")
        print("OLLAMA_OMITIDO")
        print("MOTIVO: TASK.md no contiene una tarea ejecutable.")
        print("NINGUN ARCHIVO FUE MODIFICADO")
        print("=== FIN DEL BLOQUE ===")
        raise SystemExit(0)

    git_status = run_git("status", "--short")

    print("=== BANELIO STRUCTURED AGENT ===")
    print("MODELO:", MODEL)
    print("MODO:", mode)

    if task_type:
        print("TIPO:", task_type)

    objective_match = re.search(
        r"(?ims)^\s*OBJETIVO\s*:\s*(.*?)(?=^\s*TIPO\s*:|^\s*OPERACION\s*:|^\s*REGLAS\s*:|\Z)",
        task
    )

    search_term = (
        objective_match.group(1).strip()
        if objective_match
        else task[:500]
    )

    relevant = find_relevant_files(search_term)

    if not relevant:
        relevant = find_relevant_files("BANELIO")

    if len(relevant) > MAX_CONTEXT_FILES:
        relevant = relevant[:MAX_CONTEXT_FILES]

    total_chars = sum(
        len(json.dumps(item, ensure_ascii=False))
        for item in relevant
    )

    print("ARCHIVOS CON REFERENCIA:", len(relevant))
    print("CARACTERES INICIALES:", total_chars)

    # Mantener archivos relevantes y recortar únicamente su contenido.
    # Nunca vaciar el contexto completo por superar MAX_CONTEXT_CHARS.
    if total_chars > MAX_CONTEXT_CHARS and relevant:
        base_chars = sum(
            len(json.dumps(
                {k: v for k, v in item.items() if k != "content"},
                ensure_ascii=False
            ))
            for item in relevant
        )

        available_content = max(0, MAX_CONTEXT_CHARS - base_chars)

        if available_content > 0:
            per_file = max(1, available_content // len(relevant))
            remaining = available_content

            for index, item in enumerate(relevant):
                content = item.get("content", "")

                if index == len(relevant) - 1:
                    limit = remaining
                else:
                    limit = min(len(content), per_file)

                item["content"] = content[:limit]
                remaining -= limit

            total_chars = sum(
                len(json.dumps(item, ensure_ascii=False))
                for item in relevant
            )
        else:
            relevant = [
                {k: v for k, v in item.items() if k != "content"}
                for item in relevant
            ]

            total_chars = sum(
                len(json.dumps(item, ensure_ascii=False))
                for item in relevant
            )

    context = {
        "project": PROJECT,
        "git_status": git_status,
        "task": task,
        "relevant_files": relevant
    }

    print("ARCHIVOS ENVIADOS AL MODELO:", len(relevant))

    if mode == "AUTO" and task_type == "DETERMINISTA":
        print("MODO_AUTO_DETERMINISTA")
        print("OLLAMA_OMITIDO")

        op_match = re.search(
            r"(?ims)^\s*OPERACION\s*:\s*(.*?)(?=^\s*REGLAS\s*:|\Z)",
            task
        )

        if not op_match:
            raise RuntimeError("OPERACION_DETERMINISTA_NO_ENCONTRADA")

        operation_text = op_match.group(1)

        action_match = re.search(
            r"(?im)^\s*ACCION\s*:\s*(.+?)\s*$",
            operation_text
        )
        file_match = re.search(
            r"(?im)^\s*ARCHIVO\s*:\s*(.+?)\s*$",
            operation_text
        )

        if not action_match or not file_match:
            raise RuntimeError("OPERACION_DETERMINISTA_INCOMPLETA")

        action = action_match.group(1).strip().upper()
        target = Path(file_match.group(1).strip()).resolve()

        project_root = Path(PROJECT).resolve()

        try:
            target.relative_to(project_root)
        except ValueError:
            raise RuntimeError("ARCHIVO_FUERA_DEL_PROYECTO")

        old_text = None
        new_text = None

        if action == "REPLACE":
            old_match = re.search(
                r"(?im)^\s*ORIGINAL\s*:\s*(.+?)\s*$",
                operation_text
            )
            new_match = re.search(
                r"(?im)^\s*NUEVO\s*:\s*(.*?)\s*$",
                operation_text
            )

            if not old_match or not new_match:
                raise RuntimeError("REPLACE_INCOMPLETO")

            if not target.is_file():
                raise RuntimeError("ARCHIVO_NO_EXISTE: " + str(target))

            old_text = old_match.group(1)
            new_text = new_match.group(1)

            content = target.read_text(encoding="utf-8")
            count = content.count(old_text)

            if count != 1:
                raise RuntimeError(f"TEXTO_ORIGINAL_NO_UNICO: {count}")

            new_content = content.replace(old_text, new_text, 1)

        elif action == "CREATE_FILE":
            if target.exists():
                raise RuntimeError("CREATE_FILE_ARCHIVO_YA_EXISTE")

            content_match = re.search(
                r"(?ims)^\s*CONTENIDO\s*:\s*\n(.*?)(?=^\s*REGLAS\s*:|\Z)",
                task
            )

            if not content_match:
                raise RuntimeError("CREATE_FILE_SIN_CONTENIDO")

            new_content = content_match.group(1)

        elif action == "DELETE_FILE":
            if not target.is_file():
                raise RuntimeError("DELETE_FILE_ARCHIVO_NO_EXISTE")

            new_content = None

        else:
            raise RuntimeError("ACCION_DETERMINISTA_NO_PERMITIDA: " + action)

        backup_dir = Path("/srv/banelio/backups") / (
            "auto-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        )
        backup_dir.mkdir(parents=True, exist_ok=True)

        if action in {"REPLACE", "DELETE_FILE"}:
            shutil.copy2(target, backup_dir / target.name)

        if action == "DELETE_FILE":
            target.unlink()
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(new_content, encoding="utf-8")

        validation = validate_applied_changes(project_root)

        if not validation:
            if action in {"REPLACE", "DELETE_FILE"}:
                shutil.copy2(backup_dir / target.name, target)
            else:
                target.unlink(missing_ok=True)
            raise RuntimeError("VALIDACION_FALLIDA")

        changed = str(target.relative_to(project_root))

        work_state = project_root / "BANELIO_WORK_STATE.md"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with work_state.open("a", encoding="utf-8") as f:
            f.write(
                f"\n## CHECKPOINT AUTOMATIZADO — {timestamp}\n"
                f"### Trabajo realizado\n"
                f"- Operación determinista {action} ejecutada.\n"
                f"- Archivo: `{changed}`\n"
                f"- Validación: `git diff --check` OK.\n"
                f"- Respaldo: `{backup_dir}`\n"
                f"### Estado de reanudación\n"
                f"- Tarea automática completada.\n"
            )

        commit = subprocess.run(
            ["git", "add", changed, "BANELIO_WORK_STATE.md"],
            cwd=project_root,
            text=True,
            capture_output=True
        )

        if commit.returncode != 0:
            raise RuntimeError("GIT_ADD_FALLIDO: " + commit.stderr.strip())

        commit = subprocess.run(
            ["git", "commit", "-m", "chore: automated deterministic task"],
            cwd=project_root,
            text=True,
            capture_output=True
        )

        if commit.returncode != 0:
            raise RuntimeError("GIT_CHECKPOINT_FALLIDO: " + commit.stderr.strip())

        print("ACCION:", action)
        print("ARCHIVO_MODIFICADO:", changed)
        print("BACKUP:", backup_dir)
        print("VALIDACION: git diff --check: OK")
        print("GIT_CHECKPOINT: OK")
        print("AUTO_TERMINADO")
        raise SystemExit(0)

    print("CARACTERES ENVIADOS:", total_chars)

    raw = call_ollama(
        json.dumps(context, ensure_ascii=False)
    )

    plan = parse_json(raw)

    plan_status = plan.get("status")

    if plan_status not in {"PLAN", "NO_CHANGE", "BLOCKED"}:
        raise RuntimeError(
            "STATUS inválido: " + str(plan_status)
        )

    policy_errors = validate_plan(
        plan,
        relevant,
        task
    )

    if policy_errors:
        print("POLITICA_RECHAZADA")
        for error in policy_errors:
            print("-", error)
        print("NINGUN ARCHIVO FUE MODIFICADO")
        raise SystemExit(2)

    operation_errors = validate_operations(
        plan,
        relevant
    )

    if operation_errors:
        print("OPERACIONES_RECHAZADAS")
        for error in operation_errors:
            print("-", error)
        print("NINGUN ARCHIVO FUE MODIFICADO")
        raise SystemExit(2)

    content_errors = validate_replace_content(
        plan,
        PROJECT
    )

    if content_errors:
        print("REEMPLAZOS_RECHAZADOS")
        for error in content_errors:
            print("-", error)
        print("NINGUN ARCHIVO FUE MODIFICADO")
        raise SystemExit(2)

    for item in plan.get("files", []):
        path = item.get("path")

        if not isinstance(path, str) or not path:
            raise RuntimeError("Ruta inválida en respuesta")

        safe_path(path)

        referenced = any(
            f["path"] == path
            for f in relevant
        )

        created = any(
            isinstance(operation, dict)
            and operation.get("action") == "create_file"
            and operation.get("path") == path
            for operation in plan.get("operations", [])
        )

        if not referenced and not created:
            raise RuntimeError(
                "El modelo inventó o utilizó un archivo "
                "que no fue proporcionado: " + path
            )

    if plan_status == "BLOCKED":
        print("PLAN_BLOQUEADO")
        print("MOTIVO: el modelo determinó que la tarea no puede aplicarse de forma segura.")
        print("NINGUN ARCHIVO FUE MODIFICADO")
        raise SystemExit(2)

    if plan_status == "NO_CHANGE":
        print("NO_CHANGE")
        print("NINGUN ARCHIVO FUE MODIFICADO")
        raise SystemExit(0)

    if mode == "PLAN":
        print("MODO_PLAN")
        print("OPERACIONES_VALIDADAS:", len(plan.get("operations", [])))
        print("APLICACION_DESHABILITADA")
        print("NINGUN ARCHIVO FUE MODIFICADO")
    else:
        changed_files = apply_operations(
            plan,
            PROJECT
        )
        print("MODO_APPLY")
        print("ARCHIVOS_MODIFICADOS:", len(changed_files))
        for changed_file in changed_files:
            print("-", changed_file)

        validation_result = (
            "validacion_atomica_apply_operations: OK"
            if changed_files
            else "sin_cambios"
        )
        print("VALIDACION:", validation_result)

        if changed_files:
            project_root = Path(PROJECT).resolve()
            work_state = project_root / "BANELIO_WORK_STATE.md"
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with work_state.open("a", encoding="utf-8") as f:
                f.write(
                    f"\\n## CHECKPOINT INTELIGENTE — {timestamp}\\n"
                    f"### Trabajo realizado\\n"
                    f"- Operaciones inteligentes aplicadas automáticamente.\\n"
                    f"- Archivos modificados: {len(changed_files)}\\n"
                    f"- Validación: `{validation_result}`\\n"
                    f"### Archivos\\n"
                )
                for changed_file in changed_files:
                    f.write(f"- `{changed_file}`\\n")
                f.write(
                    "### Estado de reanudación\\n"
                    "- Tarea inteligente aplicada y validada.\\n"
                )

            git_add = subprocess.run(
                ["git", "add", *changed_files, "BANELIO_WORK_STATE.md"],
                cwd=project_root,
                text=True,
                capture_output=True
            )

            if git_add.returncode != 0:
                raise RuntimeError(
                    "GIT_ADD_FALLIDO: " + git_add.stderr.strip()
                )

            git_commit = subprocess.run(
                ["git", "commit", "-m", "chore: automated intelligent task"],
                cwd=project_root,
                text=True,
                capture_output=True
            )

            if git_commit.returncode != 0:
                raise RuntimeError(
                    "GIT_CHECKPOINT_FALLIDO: " + git_commit.stderr.strip()
                )

            print("WORK_STATE: ACTUALIZADO")
            print("GIT_CHECKPOINT: OK")
        else:
            print("GIT_CHECKPOINT: OMITIDO — SIN CAMBIOS")

    with open(log_file, "w", encoding="utf-8") as f:
        f.write("=== BANELIO STRUCTURED AGENT ===\n")
        f.write(f"DATE: {datetime.now().isoformat()}\n")
        f.write(f"MODEL: {MODEL}\n\n")

        f.write("=== TASK ===\n")
        f.write(task + "\n\n")

        f.write("=== REAL FILES ===\n")
        f.write(json.dumps(
            relevant,
            ensure_ascii=False,
            indent=2
        ))
        f.write("\n\n")

        f.write("=== PLAN ===\n")
        f.write(json.dumps(
            plan,
            ensure_ascii=False,
            indent=2
        ))
        f.write("\n")

    print()
    print("=== PLAN ===")
    print(json.dumps(
        plan,
        ensure_ascii=False,
        indent=2
    ))

    print()
    print("=== RESULTADO ===")
    print("JSON_VALIDO")
    print("ARCHIVOS_REALES:", len(relevant))
    print("POLITICA_OK")
    print("LOG:", log_file)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        try:
            task_file = Path(TASK_FILE)
            task_text = (
                task_file.read_text(encoding="utf-8").strip()
                if task_file.is_file()
                else ""
            )

            objective_match = re.search(
                r"(?ims)^\s*OBJETIVO\s*:\s*(.*?)(?=^\s*TIPO\s*:|^\s*OPERACION\s*:|^\s*REGLAS\s*:|\Z)",
                task_text
            )

            objective = (
                objective_match.group(1).strip()
                if objective_match
                else ""
            )

            update_work_state(
                "ERROR",
                objective,
                str(e)
            )

            os.makedirs(LOG_DIR, exist_ok=True)
            error_stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            error_log = Path(LOG_DIR) / f"error-{error_stamp}.log"

            error_log.write_text(
                "BANELIO AGENT ERROR\n"
                f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Task: {TASK_FILE}\n"
                f"Error: {e}\n",
                encoding="utf-8"
            )

        except Exception as recovery_error:
            print("ERROR_RECUPERACION:", recovery_error)

        print("ERROR:", e)
        raise

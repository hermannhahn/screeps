# Task: Build

Módulo reutilizável para construção de estruturas.

## Logic Flow (English)

- If `memory.targetBuildId` exists:
    - Get object by ID
    - If object is null: Clear `memory.targetBuildId`
- If no target:
    - Find all construction sites in room
    - If sites found:
        - Sort sites by `progress / progressTotal` (Descending)
        - If tied, sort by `rangeTo(creep)`
        - Select first site and save to `memory.targetBuildId`
- If target exists:
    - If `build(target)` is `ERR_NOT_IN_RANGE`: Move to target
    - Return `True`
- Return `False`

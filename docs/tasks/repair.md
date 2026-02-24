# Task: Repair

Módulo responsável pela manutenção de estruturas.

## Logic Flow (English)

- If `memory.targetRepairId` exists:
    - Get object by ID
    - If null OR `hits == hitsMax`: Clear `memory.targetRepairId`
- If no target:
    - Find all structures in room with `hits < hitsMax`
    - Filter structures with `hits / hitsMax < 0.6` (60% HP threshold)
    - If found:
        - Sort by relative HP (ascending)
        - Select first and save to `memory.targetRepairId`
- If target exists:
    - If `repair(target)` is `ERR_NOT_IN_RANGE`: Move to target
    - Return `True`
- Return `False`

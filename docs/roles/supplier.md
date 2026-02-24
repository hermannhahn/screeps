# Role: Supplier

O **Supplier** (Fornecedor/Logístico) é o transportador de recursos da sala.

## Comportamento

1.  **Coleta:**
    - Prioridade 1: Energia dropada no chão (mínimo 50 unidades).
    - Prioridade 2: Containers de fontes (Source Containers).
    - Prioridade 3: Storage.
2.  **Entrega:**
    - Prioridade 1: Spawn e Extensions (para permitir novos spawns).
    - Prioridade 2: Creeps que precisam de energia (Builders/Upgraders).
    - Prioridade 3: Torres (para defesa e reparo).
    - Prioridade 4: Controller Container (para sustentar o upgrade).

## Logic Flow (English)

- If `delivering` is True AND energy is 0:
    - Set `delivering` = False, clear targets, Say "collect"
- If `delivering` is False AND free capacity is 0:
    - Set `delivering` = True, clear energy target, Say "deliver"
- If `delivering` is False:
    - If `memory.targetEnergyId` exists:
        - Check if target is valid (Dropped amount > 0 OR Structure has energy)
        - If target is Controller Container: Check if harvesters exist (Only collect if no harvesters)
        - If invalid: Clear `memory.targetEnergyId`
    - If no target:
        - Priority 1: Find dropped energy (amount >= 50, not targeted by others)
        - Priority 2: Find source containers (built, energy >= capacity, not targeted)
        - Priority 3: Find other containers or storage (energy >= capacity, not targeted, skip controller container if harvesters exist)
    - If target found:
        - If `pickup/withdraw` is `ERR_NOT_IN_RANGE`: Move to target and save ID
        - Else: Clear `memory.targetEnergyId`
    - Else if energy > 0:
        - Force `delivering` = True
- Else (delivering is True):
    - If `memory.deliveryTargetId` exists:
        - Validate target (exists and has capacity)
        - If invalid: Clear target
    - If no target:
        - Priority 1: Find closest Spawn (needs energy)
        - Priority 2: Find closest Extension (needs energy)
        - Priority 3: Find closest empty Upgrader/Builder (without assigned supplier)
        - Priority 4: Find closest Tower (needs energy)
        - Priority 5: Find Controller Container (needs energy)
    - If target found:
        - If `transfer` is `ERR_NOT_IN_RANGE`: Move to target
        - Else: Clear `deliveryTargetId` (and unassign creep if it was a creep)
    - Else (No delivery targets):
        - Fallback: Try `taskRepair.run()`
        - If failed: Try `taskBuild.run()`
        - If failed: Try `taskUpgrade.run()`

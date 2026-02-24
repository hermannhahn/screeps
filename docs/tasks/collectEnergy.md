# Task: Collect Energy

Módulo universal para coleta de energia, usado por quase todas as roles civis.

## Prioridades de Coleta

1.  **Energia Dropada:** Recursos no chão (evita desperdício por decay).
2.  **Controller Container:** Apenas se o creep for um `Upgrader`.
3.  **Source Containers:** Containers posicionados ao lado das fontes de energia.
4.  **Storage:** Armazenamento central da sala.
5.  **Controller Container:** Fallback para outras roles se as fontes acima falharem.

## Logic Flow (English)

- If `memory.assignedSupplier` exists:
    - If supplier has energy: Move to supplier and return
    - Else: Clear assignment
- If `memory.targetEnergyId` exists:
    - Validate target (Exists and has amount/energy)
    - If invalid: Clear `memory.targetEnergyId`
- If no target:
    - Get IDs of energy sources targeted by other creeps
    - Priority 1: Find dropped energy (amount > 0 AND (not targeted OR large amount))
    - Priority 1.5 (Upgraders only): Find Controller Container with energy
    - Priority 2: Find containers near sources (dist <= 3, not targeted OR large amount)
    - Priority 3: Find Storage with energy
    - Priority 4: Find Controller Container (Fallback for everyone)
- If target found:
    - If `pickup/withdraw` is `ERR_NOT_IN_RANGE`: Move to target
    - If `OK` or `ERR_FULL`: Clear `memory.targetEnergyId`
- Else (No energy found):
    - Fallback: Move to Controller and try `upgradeController`

# Manager Planner

O `Manager Planner` é o orquestrador central que decide quais estruturas devem ser construídas e quando, baseado no progresso da sala.

## Logic Flow (English)

- If current tick % 100 is not 0: **Exit** (Throttle)
- Find hostile creeps in room
- Find damaged structures
- If hostile creeps > 0 AND damaged structures > 0:
    - Log: "Room under attack, suspending planning"
    - **Exit**
- If `room.memory.currentBlueprintStage` is undefined: Initialize to 0
- Define `BLUEPRINTS_ORDER`: [spawnRoads, extensions, sourceRoads, ..., links]
- Find construction sites in room
- If construction sites > 0: **Exit** (Wait for current works to finish)
- Iterate through `BLUEPRINTS_ORDER` (index `i`):
    - Let `currentBlueprint = BLUEPRINTS_ORDER[i]`
    - If `currentBlueprint.isComplete(room, spawn)` is **False**:
        - Try `sitesCreated = currentBlueprint.plan(room, spawn)`
        - If `sitesCreated > 0`:
            - Log: "Planned X sites for stage i"
            - Update `room.memory.currentBlueprintStage = i`
            - **Break Loop** (One blueprint at a time)
        - Else:
            - **Continue** to next stage (Stage might be blocked/unsafe)

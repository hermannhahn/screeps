# Blueprint: Towers

Responsável pelo planejamento das torres de defesa.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - If Spawn position unsafe: Return 0
    - If tower exists or is planned: Return 0
    - Find roads within range 5 of spawn
    - If no roads: Return 0
    - For each road:
        - Check positions at range 2 from road:
            - If distance to spawn >= 3 AND position is not wall AND is empty:
                - `createConstructionSite(TOWER)`
                - **Break**
    - Return number of sites created
- **`isComplete(room, spawn)`**:
    - If tower exists AND no tower construction sites: Return True
    - Else: Return False

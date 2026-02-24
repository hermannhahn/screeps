# Blueprint: Extensions

Responsável pelo planejamento das extensões de energia da sala.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - If RCL < 2 OR Spawn position unsafe: Return 0
    - Get max allowed extensions for current RCL
    - Find all roads and road construction sites
    - If no roads: Return 0
    - For each road:
        - Check positions at range 2 from road
        - If position is not wall AND distance to spawn >= 2:
            - Check if range 1 around position is empty (no structures or sites)
            - If empty: `createConstructionSite(EXTENSION)`
            - Increment count until max reached
    - Return number of sites created
- **`isComplete(room, spawn)`**:
    - If RCL < 2: Return True
    - Count built extensions and extension sites
    - If `sites == 0` AND `built >= max_for_RCL`: Return True
    - Else: Return False

# Blueprint: Walls & Ramparts

Responsável pela fortificação da sala.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - Find critical structures (Spawn, Towers, Storage)
    - For each structure: `createConstructionSite(RAMPART)`
    - Find exits and calculate protective wall positions
    - `createConstructionSite(WALL)`
- **`isComplete(room, spawn)`**:
    - Check if all critical structures have ramparts
    - Check if wall lines are complete
    - Return True if no sites pending and structures exist

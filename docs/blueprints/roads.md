# Blueprint: Roads (Estradas)

Existem múltiplos blueprints de estradas: `spawnRoads`, `sourceRoads`, `controllerRoads`, `mineralRoads`.

## Logic Flow (English - Example: Source Roads)

- **`plan(room, spawn)`**:
    - For each source in room:
        - Search path from spawn to source
        - For each position in path:
            - If no road or road site: `createConstructionSite(ROAD)`
    - Return count of sites created
- **`isComplete(room, spawn)`**:
    - For each source:
        - Search path from spawn to source
        - If any position in path lacks a road: Return False
    - Return True

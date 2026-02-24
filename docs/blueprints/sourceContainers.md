# Blueprint: Source Containers

Planeja containers fixos ao lado das fontes de energia.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - For each source in room:
        - If container already exists or is planned nearby: **Continue**
        - If source position is not safe: **Continue**
        - For each adjacent position (range 1) around source:
            - If position is not wall AND is empty (no structures/sites):
                - `createConstructionSite(CONTAINER)`
                - **Break** to next source
    - Return number of sites created
- **`isComplete(room, spawn)`**:
    - For each source:
        - If no container or site within range 3: Return False
    - Return True

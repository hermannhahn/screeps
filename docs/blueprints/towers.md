# Blueprint: Towers

Responsável pelo planejamento das torres de defesa. Atualmente planeja a primeira torre no RCL 3 e a segunda no RCL 5.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - **First Tower (RCL 3)**:
        - If tower exists or is planned: Skip to Second Tower
        - Find roads within range 5 of spawn
        - Try to place 2 blocks away from a road, with min distance 3 from spawn.
    - **Second Tower (RCL 5)**:
        - If RCL < 5: Return 0
        - If 2 towers exist or are planned: Return 0
        - Search range 2 to 5 around spawn for a walkable, empty spot.
        - Ensure position is at least distance 2 from spawn and the first tower.
    - Return number of sites created
- **`isComplete(room, spawn)`**:
    - If RCL < 3: Return True (not applicable)
    - If RCL >= 3 AND < 5: Return True if 1 tower exists and no tower construction sites.
    - If RCL >= 5: Return True if 2 towers exist and no tower construction sites.
    - Else: Return False

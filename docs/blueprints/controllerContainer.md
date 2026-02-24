# Blueprint: Controller Container

Container dedicado ao upgrade do controlador.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - If controller container exists or is planned: Return 0
    - Find adjacent positions (range 1) to `room.controller`:
        - If position is not wall AND is empty:
            - `createConstructionSite(CONTAINER)`
            - **Break**
    - Return number of sites created
- **`isComplete(room, spawn)`**:
    - Return True if container exists within range 1 of controller and no site pending

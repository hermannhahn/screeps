# Blueprint: Storage & Links

Estruturas de gerenciamento de recursos avançados.

## Logic Flow (English)

- **`plan(room, spawn)`**:
    - **Storage**:
        - If RCL < 4: Skip
        - Find position near spawn (range 2-3) and empty: `createConstructionSite(STORAGE)`
    - **Links**:
        - If RCL < 5: Skip
        - Plan links near sources and controller for energy transfer
- **`isComplete(room, spawn)`**:
    - Return True if structures exist for current RCL and no sites are pending

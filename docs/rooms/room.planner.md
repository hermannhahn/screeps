# Room Planner Logic

The `room.planner.ts` module is responsible for the automated placement of structures. This ensures that the room expands its infrastructure without manual intervention.

## Planned Structures

### 1. Extensions
- **Goal**: Increase the maximum energy capacity of the room.
- **Pattern**: Initially, a simple checkerboard or radial pattern around the primary Spawn.
- **Frequency**: Checked every 100 ticks or when the Controller level (RCL) increases.

### 2. Roads
- (Future) Automatic road placement between sources, spawns, and controllers to optimize creep movement.

### 3. Containers
- (Future) Placement at sources for static mining (Harvesters) and near the controller for Upgraders.

## Safety

- **Hostile Detection**: Before placing any `ConstructionSite`, the planner checks for enemies within a **3-block range**.
- **Prevention**: If a position is deemed unsafe, the site is skipped to avoid wasting energy and risking creeps.

## Execution Flow

1. Check current RCL.
2. Determine maximum allowed structures for the current level.
3. Verify if current structures + construction sites match the maximum allowed.
4. If less, find valid positions and create `ConstructionSites`.

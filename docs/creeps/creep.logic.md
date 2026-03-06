# Creep General Logic

The `creep.logic.ts` module handles global behaviors shared by all creeps.

## Core Principles

- **Target Persistence**: "Choose well, then see it through." Once a `targetId` is set in memory, the creep will not search for a new target until the current one is gone, the mission is complete (full/empty), or an error occurs. This prevents target flickering and optimizes CPU.
- **State Management**: Standardizes the transition between "Working" (⚡) and "Refilling" (🔄).
- **Movement**: Uses path reuse to minimize CPU cost.

## Safety

- **Task Interruption**: All tasks (Collect, Deliver, Build, Repair) are interrupted if hostile creeps or structures are within a **3-block range**.
- **Self-Preservation**: This prevents creeps from getting too close to danger while performing their duties.

## Memory Properties
- `working`: Boolean state.
- `targetId`: Persistent ID of the current objective.

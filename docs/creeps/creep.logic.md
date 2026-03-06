# Creep General Logic

The `creep.logic.ts` module handles global behaviors shared by all creeps.

## Core Principles

- **Target Persistence**: "Choose well, then see it through." Once a `targetId` is set in memory, the creep will not search for a new target until the current one is gone, the mission is complete (full/empty), or an error occurs. This prevents target flickering and optimizes CPU.
- **State Management**: Standardizes the transition between "Working" (⚡) and "Refilling" (🔄).
- **Movement**: Uses path reuse to minimize CPU cost.

## Memory Properties
- `working`: Boolean state.
- `targetId`: Persistent ID of the current objective.

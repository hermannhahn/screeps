# Upgrader Logic

The `role.upgrader.ts` module focuses on Room Controller Level (RCL) progression.

## Overview
- **Primary Goal**: Increase the Controller level.
- **Behavior**: Consistently collects energy and performs the `upgradeController` action.
- **Fallback**:
    1. **Harvest**: Manually gather energy if no other sources exist.

## Strategy
- **Energy Sourcing**: Prioritizes collecting energy from the nearest container or dropped resources.
- **Constant Upgrading**: Maintains the `upgradeController` action every tick to ensure steady GCL/RCL growth.

## Positioning
- Remains within range (3 tiles) of the Controller.

## Task Modules
Reusable actions are encapsulated in the `src/tasks/` directory:
- `task.collect.ts`: Logic to find and pick up energy.
- `task.upgrade.ts`: Logic to upgrade the controller.
- `task.harvest.ts`: Logic to gather energy from sources.

# Upgrader Logic

The `role.upgrader.ts` module focuses on Room Controller Level (RCL) progression.

## Roles Overview
- **Primary Goal**: Increase Controller level.
- **Behavior**: Collects energy and performs the `upgradeController` action constantly.
- **Fallback**: 1. Harvest

## Strategy
- **Energy Sourcing**: Collects energy from the nearest container or dropped resources. If none available, it falls back to harvesting.
- **Constant Upgrading**: The goal is to keep the `upgradeController` action active every tick to ensure steady GCL/RCL growth.

## Positioning
- Stays within range (3 tiles) of the Controller.

## Task Modules
To avoid code duplication, specific actions are encapsulated in the src/tasks/ directory:

`task.collect.ts`: Logic to find and pick up energy.
`task.upgrade.ts`: Logic to upgrade the controller.
`task.harvest.ts`: Logic to find free source, save sourceId and harvest.

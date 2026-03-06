# Upgrader Logic

The `role.upgrader.ts` module focuses on Room Controller Level (RCL) progression.

## Roles Overview
- **Primary Goal**: Increase Controller level.
- **Behavior**: Collects energy and performs the `upgradeController` action constantly.

## Strategy
- **Energy Sourcing**: Collects energy from the nearest container or dropped resources. If none available, it falls back to harvesting.
- **Constant Upgrading**: The goal is to keep the `upgradeController` action active every tick to ensure steady GCL/RCL growth.

## Positioning
- Stays within range (3 tiles) of the Controller.

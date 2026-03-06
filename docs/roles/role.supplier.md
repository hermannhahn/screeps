# Logistics Logic (Supplier)

The `role.supplier.ts` module handles energy distribution throughout the room.

## Overview
- **Primary Goal**: Logistics and energy distribution.
- **Behavior**: Collects energy from Harvesters or Containers and fills Spawns, Extensions, and Towers.
- **Fallbacks**: If no logistics tasks are available, the supplier follows this priority:
    1. **Repair**: Maintain structures.
    2. **Upgrade**: Assist with controller progression.
    3. **Harvest**: Manually gather energy.

## Strategy
- **Energy Collection**: Before picking up energy, it verifies if the target has enough resources. If multiple creeps target the same resource, it ensures the total capacity of all assigned creeps does not exceed the available energy.
- **Collection Priority**:
    1. **Drops**: Find the nearest dropped energy.
    2. **Exit Containers**: Containers located near room exits.
    3. **Source Containers**: Containers within a 3-tile range of energy sources.
- **Delivery Priority**:
    1. **Spawns & Extensions**: Ensuring the room can consistently produce creeps.
    2. **Towers**: For active defense and vital repairs.
    3. **Tower Containers**: Dedicated energy for defensive structures.
    4. **Controller Containers**: Dedicated energy for Upgraders.

## Efficiency
- Suppliers are designed with one `WORK` part; the remaining parts are `CARRY` and `MOVE` to transport large volumes of energy efficiently.

## Task Modules
Reusable actions are encapsulated in the `src/tasks/` directory:
- `task.collect.ts`: Logic to find and pick up energy.
- `task.repair.ts`: Logic to repair damaged structures.
- `task.upgrade.ts`: Logic to upgrade the controller.
- `task.harvest.ts`: Logic to gather energy from sources.

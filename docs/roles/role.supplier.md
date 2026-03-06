# Logistics Logic (Supplier)

The `role.supplier.ts` module handles the distribution of energy throughout the room.

## Roles Overview
- **Primary Goal**: Logistics and energy distribution.
- **Behavior**: Collects energy from Harvesters/Containers and fills Spawns, Extensions, and Towers.
- **Fallback**: 1. Repair, 2. Upgrade, 3. Harvest

## Strategy
- **Energy Collection**: Check if the chosen target has enough energy to fill the capacity. If there is another creep with the same target set, check if the target has enough energy to fill the capacity of all those who set that target.
- **Collect Priority**:
    1. **Drop**: Find nearest drop.
    2. **Exit Containers**: Containers near room exit.
    3. **Sources Containers**: Containers in range of 3 from sources.
- **Delivery Priority**:
    1. **Spawns & Extensions**: Ensuring the room can always produce more creeps.
    2. **Towers**: For defense and vital repairs.
    3. **Towers Container**: Supplying dedicated energy for Towers.
    4. **Controller Container**: Supplying dedicated energy for Upgraders.

## Efficiency
- The suppliers are designed with one `WORK` part; the remaining parts will be for `CARRY` and `MOVE` to move large amounts of energy quickly.

## Task Modules
To avoid code duplication, specific actions are encapsulated in the src/tasks/ directory:

`task.collect.ts`: Logic to find and pick up energy.
`task.repair.ts`: Logic to repair damaged structures.
`task.upgrade.ts`: Logic to upgrade the controller.
`task.harvest.ts`: Logic to find free source, save sourceId and harvest.

## Tools
To avoid code duplication, specific actions are encapsulated in the src/tools/ directory:

`tool.example.ts`: Tool description

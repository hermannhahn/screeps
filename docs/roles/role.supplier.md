# Logistics Logic (Supplier)

The `role.supplier.ts` module handles the distribution of energy throughout the room.

## Roles Overview
- **Primary Goal**: Logistics and energy distribution.
- **Behavior**: Collects energy from Harvesters/Containers and fills Spawns, Extensions, and Towers.
- **Fallback**: 1. Repair, 2. Upgrade, 3. Harvest

## Strategy
- **Energy Collection**: Prioritizes collecting dropped energy near sources (from Harvesters) or from Containers/Storage.
- **Delivery Priority**:
    1. **Spawns & Extensions**: Ensuring the room can always produce more creeps.
    2. **Towers**: For defense and vital repairs.
    3. **Controller Containers**: (Future) Supplying dedicated energy for Upgraders.

## Efficiency
- Suppliers are designed with more `CARRY` and `MOVE` parts to move large amounts of energy quickly.

## Task Modules
To avoid code duplication, specific actions are encapsulated in the src/tasks/ directory:

`task.collect.ts`: Logic to find and pick up energy.
`task.repair.ts`: Logic to repair damaged structures.
`task.upgrade.ts`: Logic to upgrade the controller.
`task.harvest.ts`: Logic to find free source, save sourceId and harvest.

## Tools
To avoid code duplication, specific actions are encapsulated in the src/tools/ directory:

`tool.example.ts`: Tool description

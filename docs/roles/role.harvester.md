# Static Mining Logic (Harvester)

The `role.harvester.ts` module implements static mining to maximize energy throughput.

## Overview
- **Primary Goal**: Extract energy from sources.
- **Behavior**: Moves to an assigned source and harvests.
- **Delivery Logic**: 
    - **No Suppliers**: If no Suppliers are alive, the Harvester delivers energy directly to Spawns and Extensions (early game emergency).
    - **Suppliers Present**: If at least one Supplier is active, the Harvester becomes strictly static and follows this delivery priority (within a 3-tile range):
        1. **Links**: Deposit energy into a nearby Link.
        2. **Containers**: Deposit energy into a nearby Container.
        3. **Drop**: Drop energy on the ground for Suppliers to collect.

## Strategy
- **Source Assignment**: Each harvester is assigned to a specific source ID stored in `room.memory.sources`. Once assigned, this source remains unchanged until the creep's death.
- **Load Balancing**: Harvesters are distributed so that each source has a maximum of two miners (reducing to one after the room has 5+ extensions).
- **Safety**: Sources with enemies or enemy structures within a 10-tile range are ignored to prevent creep loss.
- **Static Positioning**: Once adjacent to a source, the harvester remains stationary, focusing exclusively on the `harvest` action.

## Memory Properties
- `targetId`: The ID of the source this creep is assigned to.

## Task Modules
To avoid code duplication, specific actions are encapsulated in the `src/tasks/` directory:
- `task.harvest.ts`: Logic to find a free source, save the `targetId`, and harvest.
- `task.deliver.ts`: Standard logic to deliver energy to structures.

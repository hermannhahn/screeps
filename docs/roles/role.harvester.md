# Static Mining Logic (Harvester)

The `role.harvester.ts` module implements static mining to maximize energy throughput.

## Roles Overview

- **Primary Goal**: Extract energy from sources.
- **Behavior**: Moves to a source assigned or the nearest available with either one harvester or no harvesters, harvests until full, and then brings energy to Spawns/Extensions (in the very beginning) or drops it for Suppliers.

## Strategy
- **Source Assignment**: Each harvester should ideally be assigned to a specific source ID stored in `room.memory.sources`.
- **Load Balance**: Each harvester must be assigned to a source with either one harvester or no harvesters.
- **Static Positioning**: Once next to a source, the harvester remains there, focused solely on the `harvest` action.
- **Early Game Delivery**: In the very early stages (RCL 1), harvesters may deliver energy themselves. As soon as Suppliers are available, Harvesters will drop energy on the ground or into a container for collection.

## Memory Properties
- `sourceId`: The ID of the source this creep is assigned to.

Task Modules
To avoid code duplication, specific actions are encapsulated in the src/tasks/ directory:

task.harvest.ts: Logic to find free source and harvest.
task.deliver.ts: Default logic to deliver energy.

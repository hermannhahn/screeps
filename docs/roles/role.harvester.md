# Static Mining Logic (Harvester)

The `role.harvester.ts` module implements static mining to maximize energy throughput.

## Strategy
- **Source Assignment**: Each harvester should ideally be assigned to a specific source ID stored in `room.memory.sources`.
- **Static Positioning**: Once next to a source, the harvester remains there, focused solely on the `harvest` action.
- **Early Game Delivery**: In the very early stages (RCL 1), harvesters may deliver energy themselves. As soon as Suppliers are available, Harvesters will drop energy on the ground or into a container for collection.

## Memory Properties
- `sourceId`: The ID of the source this creep is assigned to.

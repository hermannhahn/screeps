# Spawner Logic

The `spawn.logic.ts` module is responsible for maintaining the creep population in each room. It evaluates the current number of creeps for each role and decides whether to spawn a new one.

## Population Management

The spawner follows a priority list to ensure the room's economy doesn't collapse:
1. **Harvester**: Essential for energy income.
2. **Supplier**: Necessary for moving energy to the Spawn and Extensions.
3. **Upgrader**: Required for room progression.
4. **Worker**: Needed for construction and maintenance.

## Body Scaling

As the room develops (more Extensions), the spawner will automatically increase the number of body parts to create more efficient creeps.

## Pre-spawning

(Planned) The system will start spawning a replacement creep before the current one dies, ensuring zero downtime in critical roles like Harvesters.

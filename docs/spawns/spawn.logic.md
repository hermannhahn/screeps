# Spawner Logic

The `spawn.logic.ts` module maintains the creep population in each room by evaluating role counts and energy availability.

## Population Management
The spawner follows a strict priority list to prevent economic collapse:
1. **Harvester**: Vital for energy income.
2. **Supplier**: Necessary for energy distribution.
3. **Upgrader**: Required for room progression.
4. **Worker**: Needed for construction and maintenance.

## Population Limits
- **Harvester**: Two per **safe source** (within a 10-block range of enemies). Once the room has 5+ extensions, this is reduced to one per safe source.
- **Supplier**: Two per active Harvester.
- **Upgrader**: Two until RCL 3; reduced to one per room at higher levels.
- **Worker**: Fixed at two per room.

## Safety Logic
The spawner excludes any source with hostile creeps or structures within a **10-block range** when calculating the `maxHarvesters` and `maxSuppliers`. This prevents over-spawning for sources that cannot be safely harvested.

## High Priority Spawning Sequence
The spawner alternates between 1 Harvester and 1 Supplier until their respective limits are reached. Only after these roles are stabilized does it proceed to Upgraders and Workers.

## Body Scaling
As the room adds Extensions, the spawner automatically scales body parts to create more efficient creeps.

## Pre-spawning
(Planned) Start spawning a replacement creep shortly before the current one dies to ensure 100% uptime for critical roles.

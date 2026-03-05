# Roles Logic

This document explains the behavior of the initial roles used in the bot's early game.

## Roles Overview

### 1. Harvester (`role.harvester.ts`)
- **Primary Goal**: Extract energy from sources.
- **Behavior**: Moves to a source assigned or the nearest available, harvests until full, and then brings energy to Spawns/Extensions (in the very beginning) or drops it for Suppliers.

### 2. Supplier (`role.supplier.ts`)
- **Primary Goal**: Logistics and energy distribution.
- **Behavior**: Collects energy from Harvesters/Containers and fills Spawns, Extensions, and Towers.

### 3. Upgrader (`role.upgrader.ts`)
- **Primary Goal**: Increase Controller level.
- **Behavior**: Collects energy and performs the `upgradeController` action constantly.

### 4. Worker (`role.worker.ts`)
- **Primary Goal**: Construction and Maintenance.
- **Behavior**: Switches between building new structures and repairing existing ones depending on the room's needs.

## Task Modules
To avoid code duplication, specific actions are encapsulated in the `src/tasks/` directory:
- `task.collect.ts`: Logic to find and pick up energy.
- `task.build.ts`: Logic to find and build construction sites.
- `task.upgrade.ts`: Logic to upgrade the controller.
- `task.repair.ts`: Logic to repair damaged structures.

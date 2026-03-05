# Room Scanner Logic

The `room.scanner.ts` module is responsible for analyzing each visible room and storing persistent data in `Memory.rooms`. This avoids expensive `find` calls every tick by caching object IDs.

## Data Stored in Memory

- `sources`: Array of source IDs.
- `mineral`: ID of the mineral deposit.
- `controller`: ID of the room controller.
- `lastScan`: Tick when the last full scan was performed.

## Implementation Details

The scanner runs for every room in `Game.rooms`. It first checks if the room has already been scanned or if a re-scan is needed (e.g., every 500 ticks or if data is missing).

By storing these IDs, other modules (like Harvesters or Builders) can directly access the objects using `Game.getObjectById()`, which is more CPU-efficient than `room.find()`.

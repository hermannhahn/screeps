/**
 * Room Planner Module
 * Handles automated placement of construction sites.
 */
export default class RoomPlanner {
  public static run(): void {
    if (Game.time % 100 !== 0) return;

    for (const roomName in Game.rooms) {
      this.planRoom(Game.rooms[roomName]);
    }
  }

  private static planRoom(room: Room): void {
    if (!room.controller || !room.controller.my) return;

    // Plan Extensions based on RCL
    this.planExtensions(room);
  }

  private static planExtensions(room: Room): void {
    const maxExtensions = [0, 0, 5, 10, 20, 30, 40, 50, 60][room.controller!.level];
    const currentExtensions = room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_EXTENSION }
    }).length;
    const pendingExtensions = room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: { structureType: STRUCTURE_EXTENSION }
    }).length;

    if (currentExtensions + pendingExtensions < maxExtensions) {
      console.log(`[Planner] Room ${room.name}: Planning new extension (${currentExtensions + pendingExtensions}/${maxExtensions})`);
      
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        // Simple search for empty spots around spawn (radial search)
        for (let x = -5; x <= 5; x++) {
          for (let y = -5; y <= 5; y++) {
            if (currentExtensions + pendingExtensions >= maxExtensions) break;
            
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            if (room.createConstructionSite(pos, STRUCTURE_EXTENSION) === OK) {
              return; // Create one at a time per tick/check to avoid flooding
            }
          }
        }
      }
    }
  }
}

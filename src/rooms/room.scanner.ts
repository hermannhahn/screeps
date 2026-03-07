/**
 * Room Scanner Module
 * Responsible for caching room information in Memory.
 */
export default class RoomScanner {
  public static run(): void {
    for (const roomName in Game.rooms) {
      this.scan(Game.rooms[roomName]);
    }
  }

  private static scan(room: Room): void {
    if (!room.memory.sources || !room.memory.controllerId || room.memory.lastScan === undefined || Game.time % 500 === 0) {
      console.log(`[Scanner] Scanning room: ${room.name}`);
      
      // Store Sources
      const sources = room.find(FIND_SOURCES);
      room.memory.sources = sources.map(s => s.id);

      // Store Controller
      if (room.controller) {
        room.memory.controllerId = room.controller.id;
      }

      // Store Mineral
      const minerals = room.find(FIND_MINERALS);
      if (minerals.length > 0) {
        room.memory.mineralId = minerals[0].id;
      }

      room.memory.lastScan = Game.time;
    }
  }
}

// Memory extension for TypeScript
declare global {
  interface RoomMemory {
    sources?: Id<Source>[];
    controllerId?: Id<StructureController>;
    mineralId?: Id<Mineral>;
    lastScan?: number;
    planned?: {
      extensions?: { x: number, y: number }[];
      towers?: { x: number, y: number }[];
      containers?: { x: number, y: number }[];
      roads?: { x: number, y: number }[];
      storage?: { x: number, y: number }[];
    };
  }
}

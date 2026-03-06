/**
 * Room Planner Module
 * Plans and persists structure coordinates in Memory for consistent rebuilding.
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

    // Initialize memory structure if missing
    if (!room.memory.planned) room.memory.planned = {};
    if (!room.memory.planned.extensions) room.memory.planned.extensions = [];
    if (!room.memory.planned.towers) room.memory.planned.towers = [];
    if (!room.memory.planned.containers) room.memory.planned.containers = [];

    // Stop early if there are already active construction sites
    if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) return;

    // Orchestrate planning and execution based on priority
    if (this.processExtensions(room)) return;
    if (this.processTowers(room)) return;
    if (this.processContainers(room)) return;
  }

  /**
   * Extensions: Logic for planning and placing.
   */
  private static processExtensions(room: Room): boolean {
    const rcl = room.controller!.level;
    const maxExtensions = [0, 0, 5, 10, 20, 30, 40, 50, 60][rcl];
    const planned = room.memory.planned!.extensions!;

    // 1. Plan more if memory is not up to date with RCL
    if (planned.length < maxExtensions) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        for (let x = -5; x <= 5; x++) {
          for (let y = -5; y <= 5; y++) {
            if (planned.length >= maxExtensions) break;
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            
            // Check if spot is already planned, occupied or blocked
            const isPlanned = planned.some(p => p.x === pos.x && p.y === pos.y);
            const isSpawn = pos.isEqualTo(spawn.pos);
            const terrain = room.getTerrain().get(pos.x, pos.y);
            
            if (!isPlanned && !isSpawn && terrain === 0) {
              planned.push({ x: pos.x, y: pos.y });
            }
          }
        }
      }
    }

    // 2. Place sites based on memory
    for (let i = 0; i < Math.min(planned.length, maxExtensions); i++) {
      const coord = planned[i];
      const pos = new RoomPosition(coord.x, coord.y, room.name);
      
      const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_EXTENSION);
      const site = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_EXTENSION);
      
      if (!structure && !site) {
        if (room.createConstructionSite(pos, STRUCTURE_EXTENSION) === OK) {
          console.log(`[Planner] ${room.name}: Re-placed Extension from Memory at ${pos}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Towers: Logic for planning and placing.
   */
  private static processTowers(room: Room): boolean {
    const rcl = room.controller!.level;
    if (rcl < 3) return false;

    const maxTowers = [0, 0, 0, 1, 1, 2, 2, 3, 6][rcl];
    const planned = room.memory.planned!.towers!;

    if (planned.length < maxTowers) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        for (let x = -3; x <= 3; x++) {
          for (let y = -3; y <= 3; y++) {
            if (planned.length >= maxTowers) break;
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            
            const isPlanned = planned.some(p => p.x === pos.x && p.y === pos.y);
            const isSpawn = pos.isEqualTo(spawn.pos);
            const isExtension = room.memory.planned!.extensions!.some(p => p.x === pos.x && p.y === pos.y);
            const terrain = room.getTerrain().get(pos.x, pos.y);

            if (!isPlanned && !isSpawn && !isExtension && terrain === 0) {
              planned.push({ x: pos.x, y: pos.y });
            }
          }
        }
      }
    }

    for (let i = 0; i < Math.min(planned.length, maxTowers); i++) {
      const coord = planned[i];
      const pos = new RoomPosition(coord.x, coord.y, room.name);
      const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_TOWER);
      const site = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_TOWER);
      
      if (!structure && !site) {
        if (room.createConstructionSite(pos, STRUCTURE_TOWER) === OK) {
          console.log(`[Planner] ${room.name}: Re-placed Tower from Memory at ${pos}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Containers: Logic for planning and placing.
   */
  private static processContainers(room: Room): boolean {
    if (room.controller!.level < 2) return false;
    const planned = room.memory.planned!.containers!;

    // 1. Plan Source Containers
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      const isAlreadyPlanned = planned.some(p => {
        const dist = Math.max(Math.abs(p.x - source.pos.x), Math.abs(p.y - source.pos.y));
        return dist === 1;
      });

      if (!isAlreadyPlanned) {
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            const pos = new RoomPosition(source.pos.x + x, source.pos.y + y, room.name);
            const terrain = room.getTerrain().get(pos.x, pos.y);
            if (terrain === 0) {
              planned.push({ x: pos.x, y: pos.y });
              break;
            }
          }
        }
      }
    }

    // 2. Plan Controller Container
    const controller = room.controller!;
    const isContPlanned = planned.some(p => {
      const dist = Math.max(Math.abs(p.x - controller.pos.x), Math.abs(p.y - controller.pos.y));
      return dist <= 3;
    });

    if (!isContPlanned) {
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          const pos = new RoomPosition(controller.pos.x + x, controller.pos.y + y, room.name);
          const terrain = room.getTerrain().get(pos.x, pos.y);
          if (terrain === 0) {
            planned.push({ x: pos.x, y: pos.y });
            break;
          }
        }
      }
    }

    // 3. Place sites
    for (const coord of planned) {
      const pos = new RoomPosition(coord.x, coord.y, room.name);
      const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER);
      const site = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_CONTAINER);
      
      if (!structure && !site) {
        if (room.createConstructionSite(pos, STRUCTURE_CONTAINER) === OK) {
          console.log(`[Planner] ${room.name}: Re-placed Container from Memory at ${pos}`);
          return true;
        }
      }
    }
    return false;
  }
}

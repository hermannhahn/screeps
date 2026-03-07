import ToolUtils from "../tools/tool.utils";

/**
 * Room Planner Module
 * Plans and persists structure coordinates in Memory.
 * High-precision construction cadence.
 */
export default class RoomPlanner {
  public static run(): void {
    if (Game.time % 10 !== 0) return;

    for (const roomName in Game.rooms) {
      this.planRoom(Game.rooms[roomName]);
    }
  }

  private static planRoom(room: Room): void {
    if (!room.controller || !room.controller.my) return;

    // Initialize memory
    if (!room.memory.planned) room.memory.planned = {};
    if (!room.memory.planned.roads) room.memory.planned.roads = [];
    if (!room.memory.planned.extensions) room.memory.planned.extensions = [];
    if (!room.memory.planned.towers) room.memory.planned.towers = [];
    if (!room.memory.planned.containers) room.memory.planned.containers = [];
    if (!room.memory.planned.storage) room.memory.planned.storage = [];

    // Only one construction at a time to keep everything clean
    if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) return;

    // Planning priority
    if (this.processStorage(room)) return;
    if (this.processExtensions(room)) return;
    if (this.processTowers(room)) return;
    if (this.processSourceContainers(room)) return;
    if (this.processDiamondRoads(room)) return;
    if (this.processSourceRoads(room)) return;
    if (this.processControllerContainer(room)) return;
    if (this.processControllerRoads(room)) return;
  }

  private static placeFromMemory(room: Room, planned: { x: number, y: number }[], type: StructureConstant): boolean {
    if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) return false;
    const terrain = room.getTerrain();
    for (const coord of planned) {
      const pos = new RoomPosition(coord.x, coord.y, room.name);

      if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue;

      const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === type);
      const site = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === type);
      
      if (!structure && !site) {
        // Destroy blocking structures
        const blocking = pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType !== type && s.structureType !== STRUCTURE_SPAWN);
        if (blocking.length > 0) {
          for (const b of blocking) b.destroy();
          return true;
        }

        const result = room.createConstructionSite(pos, type);
        if (result === OK) {
          console.log(`[Planner] ${room.name}: New ${type} site at ${pos}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Priority 1: Storage (Unlocked at RCL 4).
   */
  private static processStorage(room: Room): boolean {
    if (room.controller!.level < 4) return false;
    const planned = room.memory.planned!.storage!;
    if (planned.length > 0) return this.placeFromMemory(room, planned, STRUCTURE_STORAGE);

    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      // Place storage near spawn but not blocking roads
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
          const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, room.name);
          if (room.getTerrain().get(pos.x, pos.y) === 0) {
            planned.push({ x: pos.x, y: pos.y });
            return this.placeFromMemory(room, planned, STRUCTURE_STORAGE);
          }
        }
      }
    }
    return false;
  }

  private static processExtensions(room: Room): boolean {
    const max = [0, 0, 5, 10, 20, 30, 40, 50, 60][room.controller!.level];
    if (!room.memory.planned) room.memory.planned = {};
    if (!room.memory.planned.extensions) room.memory.planned.extensions = [];
    const planned = room.memory.planned.extensions;

    if (planned.length < max) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        // Dynamic search area to find ANY valid spot
        for (let r = 2; r <= 20; r++) {
          if (planned.length >= max) break;
          for (let x = spawn.pos.x - r; x <= spawn.pos.x + r; x++) {
            if (planned.length >= max) break;
            for (let y = spawn.pos.y - r; y <= spawn.pos.y + r; y++) {
              if (planned.length >= max) break;
              if (x < 2 || x > 47 || y < 2 || y > 47) continue;
              
              const pos = new RoomPosition(x, y, room.name);
              const terrain = room.getTerrain().get(x, y);
              if (terrain === TERRAIN_MASK_WALL) continue;

              const isPlanned = planned.some(p => p.x === x && p.y === y);
              if (!isPlanned && pos.lookFor(LOOK_STRUCTURES).length === 0) {
                const res = room.createConstructionSite(pos, STRUCTURE_EXTENSION);
                if (res === OK) {
                  planned.push({ x: x, y: y });
                  console.log(`[Planner] ${room.name}: Success! Placed extension at ${pos}`);
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_EXTENSION);
  }

  private static processTowers(room: Room): boolean {
    const max = [0, 0, 0, 1, 1, 2, 2, 3, 6][room.controller!.level];
    const planned = room.memory.planned!.towers!;

    if (planned.length < max) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        for (let x = -3; x <= 3; x++) {
          for (let y = -3; y <= 3; y++) {
            if (planned.length >= max) break;
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            const isBlocked = planned.some(p => p.x === pos.x && p.y === pos.y) || 
                              pos.isEqualTo(spawn.pos) || 
                              room.memory.planned!.extensions!.some(p => p.x === pos.x && p.y === pos.y) ||
                              room.getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL;
            if (!isBlocked) planned.push({ x: pos.x, y: pos.y });
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_TOWER);
  }

  private static processSourceContainers(room: Room): boolean {
    const planned = room.memory.planned!.containers!;
    const sources = room.find(FIND_SOURCES);

    for (const source of sources) {
      const isPlanned = planned.some(p => Math.max(Math.abs(p.x - source.pos.x), Math.abs(p.y - source.pos.y)) === 1);
      if (!isPlanned) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const pos = new RoomPosition(source.pos.x + dx, source.pos.y + dy, room.name);
            if (room.getTerrain().get(pos.x, pos.y) === 0) {
              planned.push({ x: pos.x, y: pos.y });
              break;
            }
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
  }

  private static processDiamondRoads(room: Room): boolean {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return false;
    const planned = room.memory.planned!.roads!;

    [1, 2].forEach(r => {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) + Math.abs(dy) === r) {
            if (!planned.some(p => p.x === spawn.pos.x + dx && p.y === spawn.pos.y + dy)) {
              const terrain = room.getTerrain().get(spawn.pos.x + dx, spawn.pos.y + dy);
              if (terrain !== TERRAIN_MASK_WALL) planned.push({ x: spawn.pos.x + dx, y: spawn.pos.y + dy });
            }
          }
        }
      }
    });

    return this.placeFromMemory(room, planned, STRUCTURE_ROAD);
  }

  private static processSourceRoads(room: Room): boolean {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return false;
    const plannedRoads = room.memory.planned!.roads!;
    const containers = room.memory.planned!.containers!;

    for (const source of room.find(FIND_SOURCES)) {
      const container = containers.find(c => Math.max(Math.abs(c.x - source.pos.x), Math.abs(c.y - source.pos.y)) === 1);
      if (container) {
        const path = room.findPath(new RoomPosition(container.x, container.y, room.name), spawn.pos, { ignoreCreeps: true, ignoreRoads: true });
        for (const step of path) {
          if (!plannedRoads.some(p => p.x === step.x && p.y === step.y)) {
            plannedRoads.push({ x: step.x, y: step.y });
          }
        }
      }
    }
    return this.placeFromMemory(room, plannedRoads, STRUCTURE_ROAD);
  }

  private static processControllerContainer(room: Room): boolean {
    if (room.controller!.level < 2) return false;
    const planned = room.memory.planned!.containers!;
    const controller = room.controller!;

    // Search for a position exactly 1 block away from the controller
    const isPlanned = planned.some(p => Math.max(Math.abs(p.x - controller.pos.x), Math.abs(p.y - controller.pos.y)) === 1);
    if (!isPlanned) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const pos = new RoomPosition(controller.pos.x + dx, controller.pos.y + dy, room.name);
          if (room.getTerrain().get(pos.x, pos.y) === 0) {
            planned.push({ x: pos.x, y: pos.y });
            return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
  }

  private static processControllerRoads(room: Room): boolean {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn || !room.controller) return false;
    const plannedRoads = room.memory.planned!.roads!;
    const containers = room.memory.planned!.containers!;

    const container = containers.find(c => Math.max(Math.abs(c.x - room.controller!.pos.x), Math.abs(c.y - room.controller!.pos.y)) <= 3);
    if (container) {
      const path = room.findPath(new RoomPosition(container.x, container.y, room.name), spawn.pos, { ignoreCreeps: true, ignoreRoads: true });
      for (const step of path) {
        if (!plannedRoads.some(p => p.x === step.x && p.y === step.y)) {
          plannedRoads.push({ x: step.x, y: step.y });
        }
      }
    }
    return this.placeFromMemory(room, plannedRoads, STRUCTURE_ROAD);
  }
}

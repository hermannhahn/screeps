import ToolUtils from "../tools/tool.utils";

/**
 * Room Planner Module
 * Plans and persists structure coordinates in Memory for consistent rebuilding.
 * Priorities: Diamond Roads -> Extensions -> Towers -> Source Containers -> Source Roads -> 
 *             Controller Container -> Controller Roads -> Exit Containers.
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

    // Initialize memory structure if missing
    if (!room.memory.planned) room.memory.planned = {};
    if (!room.memory.planned.roads) room.memory.planned.roads = [];
    if (!room.memory.planned.extensions) room.memory.planned.extensions = [];
    if (!room.memory.planned.towers) room.memory.planned.towers = [];
    if (!room.memory.planned.containers) room.memory.planned.containers = [];

    // Stop if there are too many active construction sites
    if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 10) return;

    // Orchestrate planning and execution based on strict priority
    this.processDiamondRoads(room);
    this.processExtensions(room);
    this.processTowers(room);
    this.processSourceContainers(room);
    this.processSourceRoads(room);
    this.processControllerContainer(room);
    this.processControllerRoads(room);
    this.processExitContainers(room);
  }

  /**
   * Helper to place a construction site from memory coordinates.
   */
  private static placeFromMemory(room: Room, planned: { x: number, y: number }[], type: StructureConstant): boolean {
    for (const coord of planned) {
      const pos = new RoomPosition(coord.x, coord.y, room.name);

      // SAFETY: Do not place CS if enemies are nearby (3-block range)
      if (!ToolUtils.isSafe(pos, 3)) continue;

      const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === type);
      const site = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === type);
      
      if (!structure && !site) {
        // Clear EVERYTHING blocking this position (except Spawn and same-type structures)
        const blocking = pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType !== type && s.structureType !== STRUCTURE_SPAWN);
        if (blocking.length > 0) {
          for (const b of blocking) {
            console.log(`[Planner] ${room.name}: Destroying blocking ${b.structureType} at ${pos} to place ${type}`);
            b.destroy();
          }
          return true; // Wait for next tick to clear
        }

        const result = room.createConstructionSite(pos, type);
        if (result === OK) {
          console.log(`[Planner] ${room.name}: Re-placed ${type} from Memory at ${pos}`);
          return true;
        } else if (result !== ERR_RCL_NOT_ENOUGH) {
          console.log(`[Planner] ${room.name}: Critical failure to place ${type} at ${pos}. Error: ${result}`);
        }
      }
    }
    return false;
  }

  /**
   * Priority 1: Diamond Roads around Spawn.
   */
  private static processDiamondRoads(room: Room): boolean {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return false;
    const planned = room.memory.planned!.roads!;

    // Plan Diamond
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

  /**
   * Priority 2: Extensions.
   */
  private static processExtensions(room: Room): boolean {
    const max = [0, 0, 5, 10, 20, 30, 40, 50, 60][room.controller!.level];
    const planned = room.memory.planned!.extensions!;

    if (planned.length < max) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        for (let x = -5; x <= 5; x++) {
          for (let y = -5; y <= 5; y++) {
            if (planned.length >= max) break;
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            const isBlocked = planned.some(p => p.x === pos.x && p.y === pos.y) || 
                              pos.isEqualTo(spawn.pos) || 
                              room.memory.planned!.roads!.some(p => p.x === pos.x && p.y === pos.y) ||
                              room.getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL;
            if (!isBlocked) planned.push({ x: pos.x, y: pos.y });
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_EXTENSION);
  }

  /**
   * Priority 3: Towers.
   */
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
                              room.memory.planned!.roads!.some(p => p.x === pos.x && p.y === pos.y) ||
                              room.getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL;
            if (!isBlocked) planned.push({ x: pos.x, y: pos.y });
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_TOWER);
  }

  /**
   * Priority 4: Source Containers.
   */
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
    // Note: This only places the ones currently in 'containers' array. We filter by proximity to sources.
    return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
  }

  /**
   * Priority 5: Source Roads (Source to nearest Diamond Road).
   */
  private static processSourceRoads(room: Room): boolean {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return false;
    const plannedRoads = room.memory.planned!.roads!;
    const containers = room.memory.planned!.containers!;

    for (const source of room.find(FIND_SOURCES)) {
      // Find the planned container for this source
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

  /**
   * Priority 6: Controller Container.
   */
  private static processControllerContainer(room: Room): boolean {
    if (room.controller!.level < 2) return false;
    const planned = room.memory.planned!.containers!;
    const controller = room.controller!;

    const isPlanned = planned.some(p => Math.max(Math.abs(p.x - controller.pos.x), Math.abs(p.y - controller.pos.y)) <= 3);
    if (!isPlanned) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const pos = new RoomPosition(controller.pos.x + dx, controller.pos.y + dy, room.name);
          if (room.getTerrain().get(pos.x, pos.y) === 0) {
            planned.push({ x: pos.x, y: pos.y });
            break;
          }
        }
      }
    }
    return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
  }

  /**
   * Priority 7: Controller Roads.
   */
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

  /**
   * Priority 8: Exit Containers.
   */
  private static processExitContainers(room: Room): boolean {
    if (room.controller!.level < 3) return false;
    const planned = room.memory.planned!.containers!;
    const exits = room.find(FIND_EXIT);

    if (exits.length > 0 && planned.length < 5) { // Arbitrary limit for now
       // Logic to place near exit if needed
    }
    return this.placeFromMemory(room, planned, STRUCTURE_CONTAINER);
  }
}

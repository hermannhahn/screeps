/**
 * Room Planner Module
 * Handles automated placement of construction sites based on a strict priority system.
 */
export default class RoomPlanner {
  public static run(): void {
    if (Game.time % 100 !== 0) return;

    for (const roomName in Game.rooms) {
      this.planRoom(Game.rooms[roomName]);
    }
  }

  /**
   * Orchestrates the planning based on priorities.
   * If a higher priority task creates a site, it returns early for that cycle.
   */
  private static planRoom(room: Room): void {
    if (!room.controller || !room.controller.my) return;

    // Stop planning if there are already active construction sites in the room
    const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    if (constructionSites.length > 0) return;

    // PRIORITY 1: Extensions (Economic Scaling)
    if (this.planExtensions(room)) return;

    // PRIORITY 2: Towers (Active Defense - RCL 3+)
    if (this.planTowers(room)) return;

    // PRIORITY 3: Containers (Logistics - Sources then Controller)
    if (this.planContainers(room)) return;
  }

  private static planExtensions(room: Room): boolean {
    const maxExtensions = [0, 0, 5, 10, 20, 30, 40, 50, 60][room.controller!.level];
    const current = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
    const pending = room.find(FIND_MY_CONSTRUCTION_SITES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;

    if (current + pending < maxExtensions) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        for (let x = -5; x <= 5; x++) {
          for (let y = -5; y <= 5; y++) {
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            if (room.createConstructionSite(pos, STRUCTURE_EXTENSION) === OK) {
              console.log(`[Planner] ${room.name}: Planned Extension at ${pos}`);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private static planTowers(room: Room): boolean {
    const rcl = room.controller!.level;
    if (rcl < 3) return false;

    const maxTowers = [0, 0, 0, 1, 1, 2, 2, 3, 6][rcl];
    const current = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).length;
    const pending = room.find(FIND_MY_CONSTRUCTION_SITES, { filter: { structureType: STRUCTURE_TOWER } }).length;

    if (current + pending < maxTowers) {
      const spawn = room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        // Place tower near spawn for central defense
        for (let x = -3; x <= 3; x++) {
          for (let y = -3; y <= 3; y++) {
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
            if (room.createConstructionSite(pos, STRUCTURE_TOWER) === OK) {
              console.log(`[Planner] ${room.name}: Planned Tower at ${pos}`);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private static planContainers(room: Room): boolean {
    const rcl = room.controller!.level;
    if (rcl < 2) return false;

    // 1. Source Containers (High priority logistics)
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      const containers = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: { structureType: STRUCTURE_CONTAINER } });
      const sites = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, { filter: { structureType: STRUCTURE_CONTAINER } });

      if (containers.length === 0 && sites.length === 0) {
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            const pos = new RoomPosition(source.pos.x + x, source.pos.y + y, room.name);
            if (room.createConstructionSite(pos, STRUCTURE_CONTAINER) === OK) {
              console.log(`[Planner] ${room.name}: Planned Source Container at ${pos}`);
              return true;
            }
          }
        }
      }
    }

    // 2. Controller Container (Low priority logistics)
    const controller = room.controller!;
    const contContainers = controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
    const contSites = controller.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });

    if (contContainers.length === 0 && contSites.length === 0) {
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          const pos = new RoomPosition(controller.pos.x + x, controller.pos.y + y, room.name);
          if (room.createConstructionSite(pos, STRUCTURE_CONTAINER) === OK) {
            console.log(`[Planner] ${room.name}: Planned Controller Container at ${pos}`);
            return true;
          }
        }
      }
    }

    return false;
  }
}

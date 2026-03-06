import ToolUtils from "../tools/tool.utils";

/**
 * Spawner Logic
 * Manages creep population following a strict priority and alternating sequence.
 */
export default class SpawnLogic {
  public static run(): void {
    for (const spawnName in Game.spawns) {
      this.manageSpawn(Game.spawns[spawnName]);
    }
  }

  private static manageSpawn(spawn: StructureSpawn): void {
    if (spawn.spawning) return;

    const room = spawn.room;
    const creeps = room.find(FIND_MY_CREEPS);

    // Current population
    const harvesters = creeps.filter(c => c.memory.role === 'harvester');
    const suppliers = creeps.filter(c => c.memory.role === 'supplier');
    const upgraders = creeps.filter(c => c.memory.role === 'upgrader');
    const workers = creeps.filter(c => c.memory.role === 'worker');

    // Population limits - SAFETY: Only count safe sources (10-block range)
    const sourceCount = ToolUtils.getSafeSources(room).length || 1;
    const extensionCount = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
    
    const maxHarvesters = extensionCount >= 5 ? sourceCount : sourceCount * 2;
    const maxSuppliers = Math.min(harvesters.length, sourceCount + 1); // Limit suppliers more strictly
    const maxUpgraders = (room.controller?.level || 1) === 1 ? 3 : (room.controller?.level || 1) <= 3 ? 2 : 1;
    const maxWorkers = 2;

    // 1. Critical Priority: Minimum Economy (1 Harvester + 1 Supplier)
    if (harvesters.length < 1) {
      this.spawnCreep(spawn, 'harvester', this.getBody(room, 'harvester'));
      return;
    }
    if (suppliers.length < 1) {
      this.spawnCreep(spawn, 'supplier', this.getBody(room, 'supplier'));
      return;
    }

    // 2. Secondary Priority: Core Roles (Upgrader + Worker)
    if (upgraders.length < 1) {
      this.spawnCreep(spawn, 'upgrader', this.getBody(room, 'upgrader'));
      return;
    }
    if (workers.length < 1) {
      this.spawnCreep(spawn, 'worker', this.getBody(room, 'worker'));
      return;
    }

    // 3. Tertiary Priority: Filling to Max Limits
    if (harvesters.length < maxHarvesters) {
      this.spawnCreep(spawn, 'harvester', this.getBody(room, 'harvester'));
      return;
    }
    if (suppliers.length < maxSuppliers) {
      this.spawnCreep(spawn, 'supplier', this.getBody(room, 'supplier'));
      return;
    }
    if (upgraders.length < maxUpgraders) {
      this.spawnCreep(spawn, 'upgrader', this.getBody(room, 'upgrader'));
      return;
    }
    if (workers.length < maxWorkers) {
      this.spawnCreep(spawn, 'worker', this.getBody(room, 'worker'));
      return;
    }
  }

  private static spawnCreep(spawn: StructureSpawn, role: string, body: BodyPartConstant[]): void {
    const name = `${role}_${Game.time}`;
    const result = spawn.spawnCreep(body, name, {
      memory: { role: role, working: false }
    });

    if (result === OK) {
      console.log(`[Spawner] Spawning new ${role}: ${name}`);
    }
  }

  /**
   * Generates creep body based on role and room energy capacity.
   */
  private static getBody(room: Room, role: string): BodyPartConstant[] {
    const energy = room.energyCapacityAvailable;

    if (role === 'supplier') {
      // One WORK part, remaining CARRY/MOVE
      if (energy >= 300) return [WORK, CARRY, CARRY, MOVE, MOVE];
      return [WORK, CARRY, MOVE];
    }

    // Basic body for other roles
    if (energy >= 550) return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
    if (energy >= 400) return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    return [WORK, CARRY, MOVE];
  }
}

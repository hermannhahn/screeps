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
    const scouts = Object.values(Game.creeps).filter(c => c.memory.role === 'scout');

    // Emergency check: If no harvesters, spawn one with CURRENT energy
    const isEmergency = harvesters.length < 1;
    const energy = isEmergency ? room.energyAvailable : room.energyCapacityAvailable;

    // Population limits - SAFETY: Only count safe sources (10-block range)
    const sourceCount = ToolUtils.getSafeSources(room).length || 1;
    const extensionCount = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
    const hasStorage = room.storage !== undefined;
    const energyLevel = room.energyCapacityAvailable;

    // Dynamic Limits for Productivity
    const maxHarvesters = sourceCount; // 1 powerful harvester per source is enough if body is good
    const maxSuppliers = Math.max(2, sourceCount); // At least 2 suppliers for redundancy
    
    // Upgraders: Scale with energy surplus or storage level
    let maxUpgraders = 1;
    if (room.controller?.level === 1) maxUpgraders = 4;
    else if (room.controller?.level === 2) maxUpgraders = 3;
    else if (room.controller?.level === 3) maxUpgraders = 2;
    
    if (hasStorage && room.storage!.store[RESOURCE_ENERGY] > 50000) maxUpgraders += 2;
    if (hasStorage && room.storage!.store[RESOURCE_ENERGY] > 200000) maxUpgraders += 3;

    const maxWorkers = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 ? 2 : 1;
    const maxScouts = (room.controller?.level || 1) >= 2 ? 1 : 0;

    // 1. Critical Priority: Minimum Economy (1 Harvester + 1 Supplier)
    if (harvesters.length < 1) {
      this.spawnCreep(spawn, 'harvester', this.getBody(room.energyAvailable, 'harvester'));
      return;
    }
    if (suppliers.length < 1) {
      this.spawnCreep(spawn, 'supplier', this.getBody(room.energyAvailable, 'supplier'));
      return;
    }

    // 2. Secondary Priority: Filling Core Roles
    if (harvesters.length < maxHarvesters) {
      this.spawnCreep(spawn, 'harvester', this.getBody(energyLevel, 'harvester'));
      return;
    }
    if (suppliers.length < maxSuppliers) {
      this.spawnCreep(spawn, 'supplier', this.getBody(energyLevel, 'supplier'));
      return;
    }

    // 3. Growth Priority: Upgraders, Workers, Scouts
    if (upgraders.length < 1) {
      this.spawnCreep(spawn, 'upgrader', this.getBody(energyLevel, 'upgrader'));
      return;
    }
    if (workers.length < maxWorkers) {
      this.spawnCreep(spawn, 'worker', this.getBody(energyLevel, 'worker'));
      return;
    }
    if (scouts.length < maxScouts) {
      this.spawnCreep(spawn, 'scout', [MOVE]);
      return;
    }
    if (upgraders.length < maxUpgraders) {
      this.spawnCreep(spawn, 'upgrader', this.getBody(energyLevel, 'upgrader'));
      return;
    }
  }

  private static spawnCreep(spawn: StructureSpawn, role: string, body: BodyPartConstant[]): void {
    const name = `${role}_${Game.time}`;
    const result = spawn.spawnCreep(body, name, {
      memory: { role: role, working: false }
    });

    if (result === OK) {
      console.log(`[Spawner] Spawning new ${role}: ${name} with body: [${body}]`);
    }
  }

  /**
   * Generates creep body based on role and given energy level.
   * Optimized for maximum productivity.
   */
  private static getBody(energy: number, role: string): BodyPartConstant[] {
    const body: BodyPartConstant[] = [];
    
    if (role === 'scout') return [MOVE];

    if (role === 'harvester') {
      // Harvesters need WORK and enough MOVE to reach the source.
      // 5 WORK parts saturate a source.
      let workParts = Math.min(5, Math.floor((energy - 100) / 100));
      if (workParts < 1) workParts = 1;
      for (let i = 0; i < workParts; i++) body.push(WORK);
      body.push(CARRY); // 1 CARRY to hold some energy
      body.push(MOVE);  // 1 MOVE is usually enough if they stay at the source
      return body;
    }

    if (role === 'supplier') {
      // Suppliers need CARRY and MOVE (1:1 ratio for full speed)
      let units = Math.floor(energy / 150); // WORK(100) + CARRY(50) + MOVE(50) = 200, or CARRY+MOVE = 100
      // We want some WORK for small repairs or assisting building if idle
      body.push(WORK);
      let remainingEnergy = energy - 100;
      let sets = Math.min(10, Math.floor(remainingEnergy / 100)); // Limit size
      if (sets < 1) sets = 1;
      for (let i = 0; i < sets; i++) body.push(CARRY);
      for (let i = 0; i < sets; i++) body.push(MOVE);
      return body;
    }

    // Default for Upgraders and Workers: balanced WORK, CARRY, MOVE
    let costPerSet = 200; // WORK + CARRY + MOVE
    let sets = Math.floor(energy / costPerSet);
    if (sets < 1) sets = 1;
    if (sets > 15) sets = 15; // Max size limit

    for (let i = 0; i < sets; i++) body.push(WORK);
    for (let i = 0; i < sets; i++) body.push(CARRY);
    for (let i = 0; i < sets; i++) body.push(MOVE);

    return body;
  }
}

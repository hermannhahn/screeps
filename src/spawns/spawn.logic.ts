/**
 * Spawner Logic
 * Manages creep population and spawning priorities.
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

    // Population counts
    const harvesters = creeps.filter(c => c.memory.role === 'harvester');
    const suppliers = creeps.filter(c => c.memory.role === 'supplier');
    const upgraders = creeps.filter(c => c.memory.role === 'upgrader');
    const workers = creeps.filter(c => c.memory.role === 'worker');

    // Priority Spawning
    if (harvesters.length < 2) {
      this.spawnCreep(spawn, 'harvester', [WORK, MOVE, CARRY]);
    } else if (suppliers.length < 2) {
      this.spawnCreep(spawn, 'supplier', [CARRY, CARRY, MOVE, MOVE]);
    } else if (upgraders.length < 2) {
      this.spawnCreep(spawn, 'upgrader', [WORK, CARRY, MOVE]);
    } else if (workers.length < 1) {
      this.spawnCreep(spawn, 'worker', [WORK, CARRY, MOVE]);
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
}

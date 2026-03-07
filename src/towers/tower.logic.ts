/**
 * Tower Logic Module
 * Handles defense, healing, and emergency repairs for all towers in the room.
 */
export default class TowerLogic {
  public static run(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      const towers = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER }
      }) as StructureTower[];

      for (const tower of towers) {
        if (this.handleDefense(tower)) continue;
        if (this.handleHealing(tower)) continue;
        if (this.handleRepair(tower)) continue;
      }
    }
  }

  /**
   * Attacks the closest hostile creep.
   */
  private static handleDefense(tower: StructureTower): boolean {
    const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      tower.attack(closestHostile);
      return true;
    }
    return false;
  }

  /**
   * Heals the closest damaged friendly creep.
   */
  private static handleHealing(tower: StructureTower): boolean {
    const closestDamagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (c) => c.hits < c.hitsMax
    });
    if (closestDamagedCreep) {
      tower.heal(closestDamagedCreep);
      return true;
    }
    return false;
  }

  /**
   * Repairs non-wall structures with critical hits (< 50% or low absolute).
   */
  private static handleRepair(tower: StructureTower): boolean {
    // Only repair if tower has decent energy to save for defense
    if (tower.store[RESOURCE_ENERGY] < 500) return false;

    const criticalTarget = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => {
        if (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) {
           return s.hits < 5000; // Very low threshold for walls initially
        }
        return s.hits < s.hitsMax * 0.5; // Critical damage for normal structures
      }
    });

    if (criticalTarget) {
      tower.repair(criticalTarget);
      return true;
    }
    return false;
  }
}

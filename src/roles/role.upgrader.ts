import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Upgrader
 * Controller upgrade logic.
 */
export default class RoleUpgrader {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      if (creep.room.controller) {
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, creep.room.controller);
        }
      }
    } else {
      // Try to pick up dropped energy first
      const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
      });

      if (dropped) {
        if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, dropped);
        }
      } else {
        // Fallback to harvest if no dropped energy
        const source = Game.getObjectById(creep.room.memory.sources?.[0] as Id<Source>);
        if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, source);
        }
      }
    }
  }
}

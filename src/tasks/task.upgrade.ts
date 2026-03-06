import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Upgrade
 * Moves to and upgrades the room controller.
 */
export default class TaskUpgrade {
  public static run(creep: Creep): void {
    if (creep.room.controller) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, creep.room.controller);
      }
    }
  }
}

import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Upgrader
 * Controller progression with fallbacks.
 */
export default class RoleUpgrader {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      TaskUpgrade.run(creep);
    } else {
      // Priority: Collect, Fallback: Harvest
      const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
      });

      if (dropped.length > 0) {
        TaskCollect.run(creep);
      } else {
        TaskHarvest.run(creep);
      }
    }
  }
}

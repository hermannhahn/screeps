import CreepLogic from "../creeps/creep.logic";
import TaskHarvest from "../tasks/task.harvest";
import TaskDeliver from "../tasks/task.deliver";

/**
 * Role: Harvester
 * Static mining and early delivery.
 */
export default class RoleHarvester {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // Harvesters only deliver if the room is at RCL 1 or has no suppliers
      const suppliers = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => c.memory.role === 'supplier'
      });

      if (creep.room.controller?.level === 1 || suppliers.length === 0) {
        TaskDeliver.run(creep);
      } else {
        // Just drop the energy if we are full and static mining
        creep.drop(RESOURCE_ENERGY);
      }
    } else {
      TaskHarvest.run(creep);
    }
  }
}

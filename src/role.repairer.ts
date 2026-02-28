import taskRepair from './task.repair';
import taskCollectEnergy from './task.collectEnergy';

const roleRepairer = {
    run: function(creep: Creep) {
        if (creep.memory.repairing && creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.repairing = false;
            delete creep.memory.targetRepairId;
        }
        if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0) {
            creep.memory.repairing = true;
            delete creep.memory.targetEnergyId;
        }

        if (creep.memory.repairing) {
            taskRepair.run(creep);
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleRepairer;

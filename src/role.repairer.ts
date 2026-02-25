import taskRepair from './task.repair';
import taskCollectEnergy from './task.collectEnergy';
import taskUpgrade from './task.upgrade';

const roleRepairer = {
    run: function(creep: Creep) {
        if (creep.memory.repairing && creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.repairing = false;
            delete creep.memory.targetRepairId;
            creep.say('🔄 gather');
        }
        if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0) {
            creep.memory.repairing = true;
            delete creep.memory.targetEnergyId;
            creep.say('🛠️ repair');
        }

        if (creep.memory.repairing) {
            if (!taskRepair.run(creep)) {
                taskUpgrade.run(creep);
            }
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleRepairer;

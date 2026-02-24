import taskDeliver from './task.deliver';
import taskCollectEnergy from './task.collectEnergy';
import taskRepair from './task.repair';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

const roleSupplier = {
    run: function(creep: Creep) {
        // State Toggle
        if (creep.memory.delivering && creep.store.getUsedCapacity() === 0) {
            creep.memory.delivering = false;
            delete creep.memory.deliveryTargetId;
            creep.say('🔄 collect');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            delete creep.memory.targetEnergyId;
            creep.say('📦 deliver');
        }

        if (creep.memory.delivering) {
            if (!taskDeliver.run(creep)) {
                // Secondary tasks if no one needs delivery
                if (!taskRepair.run(creep)) {
                    if (!taskBuild.run(creep)) {
                        taskUpgrade.run(creep);
                    }
                }
            }
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleSupplier;

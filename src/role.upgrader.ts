import taskCollectEnergy from './task.collectEnergy';
import taskUpgrade from './task.upgrade';

const roleUpgrader = {
    run: function(creep: Creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 fetch');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if (creep.memory.upgrading) {
            taskUpgrade.run(creep);
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleUpgrader;

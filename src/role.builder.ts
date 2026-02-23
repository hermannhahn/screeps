import taskCollectEnergy from './task.collectEnergy';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

const roleBuilder = {
    run: function(creep: Creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄 fetch');
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🚧 builder');
        }

        if (creep.memory.building) {
            // Prioridade 1: Construir
            if (!taskBuild.run(creep)) {
                // Fallback: Upgrade
                taskUpgrade.run(creep);
            }
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleBuilder;

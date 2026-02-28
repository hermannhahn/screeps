import taskCollectEnergy from './task.collectEnergy';
import taskBuild from './task.build';

const roleBuilder = {
    run: function(creep: Creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            delete creep.memory.targetBuildId;
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            delete creep.memory.targetEnergyId;
        }

        if (creep.memory.building) {
            taskBuild.run(creep);
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleBuilder;

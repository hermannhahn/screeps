import taskCollectEnergy from './task.collectEnergy';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

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
            if (!taskBuild.run(creep)) {
                taskUpgrade.run(creep);
            }
        } else {
            taskCollectEnergy.run(creep);
        }
    }
};

export default roleBuilder;

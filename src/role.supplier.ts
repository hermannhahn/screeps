import _ from 'lodash';
import taskDeliver from './task.deliver';
import taskCollectEnergy from './task.collectEnergy';
import taskRepair from './task.repair';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';
import { getIncomingCollection } from './utils.creep';

const roleSupplier = {
    run: function(creep: Creep) {
        // State Toggle
        if (creep.memory.delivering && creep.store.getUsedCapacity() === 0) {
            creep.memory.delivering = false;
            delete creep.memory.deliveryTargetId;
            creep.say('🔄');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            delete creep.memory.targetEnergyId;
            creep.say('📦');
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
            // PRIORITY 1: Source Containers (Specific for Suppliers to keep mining flowing)
            let target = creep.memory.targetEnergyId ? Game.getObjectById(creep.memory.targetEnergyId as Id<any>) : null;

            if (!target) {
                const sources = creep.room.find(FIND_SOURCES);
                const sourceContainers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                        (s.store.getUsedCapacity(RESOURCE_ENERGY) - getIncomingCollection(s.id)) > 0 &&
                        sources.some(src => s.pos.getRangeTo(src) <= 3)
                }) as StructureContainer[];

                if (sourceContainers.length > 0) {
                    // Get the one with most energy to empty it faster
                    target = _.maxBy(sourceContainers, (c) => c.store[RESOURCE_ENERGY] - getIncomingCollection(c.id)) || null;
                    if (target) {
                        creep.memory.targetEnergyId = target.id;
                    }
                }
            }

            if (target && target instanceof StructureContainer && target.pos.findInRange(FIND_SOURCES, 3).length > 0) {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    creep.say('🔄');
                    delete creep.memory.targetEnergyId;
                }
            } else {
                // Fallback to general collection (Dropped energy, Storage, etc.)
                taskCollectEnergy.run(creep);
            }
        }
    }
};

export default roleSupplier;

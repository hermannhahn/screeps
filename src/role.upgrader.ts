import taskUpgrade from './task.upgrade';
import taskCollectEnergy from './task.collectEnergy';
import { findControllerContainer } from './blueprints/utils';
import { getIncomingCollection } from './utils.creep';

const roleUpgrader = {
    run: function(creep: Creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say('🔌');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            delete creep.memory.targetEnergyId;
            creep.say('⚡');
        }

        if (creep.memory.upgrading) {
            // Sign controller logic
            const signMessage = "Stay away! This room is protected by advanced AI. 🛡️💀";
            if (creep.room.controller && (!creep.room.controller.sign || creep.room.controller.sign.text !== signMessage)) {
                if (creep.signController(creep.room.controller, signMessage) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                    return; // Focus on signing first
                }
            }
            taskUpgrade.run(creep);
        } else {
            // Priority: Links (very efficient for upgraders)
            const link = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LINK && s.store[RESOURCE_ENERGY] > 0
            }) as StructureLink | null;

            if (link) {
                if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(link, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                // Priority 1: Controller Container (Prefer this for upgraders)
                const ctrlContainer = findControllerContainer(creep.room);
                if (ctrlContainer && 'store' in ctrlContainer && (ctrlContainer.store.getUsedCapacity(RESOURCE_ENERGY) - getIncomingCollection(ctrlContainer.id)) > 0) {
                    if (creep.withdraw(ctrlContainer as StructureContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(ctrlContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // Fallback to general collection logic which respects reservations
                    taskCollectEnergy.run(creep);
                }
            }
        }
    }
};

export default roleUpgrader;

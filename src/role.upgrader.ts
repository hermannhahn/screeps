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
            // Lógica de coleta de energia para Upgrader, priorizando Links
            const link = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LINK && s.energy > 0
            }) as StructureLink | null; // Adicionado s.energy > 0 para garantir que o link tenha energia

            if (link) {
                if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(link, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                // Se não há links, usar a lógica de taskCollectEnergy (ou reescrever aqui)
                // Por enquanto, podemos reescrever uma versão simplificada de taskCollectEnergy aqui
                const containerOrStorage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
                });
                if (containerOrStorage) {
                    if (creep.withdraw(containerOrStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(containerOrStorage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    const droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (r) => r.resourceType === RESOURCE_ENERGY
                    });
                    if (droppedEnergy) {
                        if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    } else {
                        const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                        if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    }
                }
            }
        }
    }
};

export default roleUpgrader;

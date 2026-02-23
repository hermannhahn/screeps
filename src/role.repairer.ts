import _ from 'lodash';

const roleRepairer = {
    run: function(creep: Creep) {
        // Estado: repairing ou gathering
        if (creep.memory.repairing && creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.repairing = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0) {
            creep.memory.repairing = true;
            creep.say('🛠️ repair');
        }

        if (creep.memory.repairing) {
            const damagedStructures = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax && structure.structureType !== STRUCTURE_ROAD
            });

            // Ordenar por menos hits percentualmente
            damagedStructures.sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));

            if (damagedStructures.length > 0) {
                if (creep.repair(damagedStructures[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(damagedStructures[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                // Se não houver nada para reparar, upar o controller para não ficar ocioso
                if (creep.upgradeController(creep.room.controller as StructureController) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller as StructureController, { visualizePathStyle: { stroke: '#66ccff' } });
                }
            }
        } else {
            // Coletar energia
            const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            });
            if (container) {
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        }
    }
};

export default roleRepairer;
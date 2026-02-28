// src/role.supplier.ts
export function runSupplier(creep: Creep): void {
    const room = creep.room;

    // Auto-suicídio para reciclagem se não tiver WORK part (para a nova lógica de manutenção)
    if (creep.getActiveBodyparts(WORK) === 0) {
        console.log(`${creep.name}: Reciclando para obter corpo com WORK.`);
        creep.suicide();
        return;
    }

    // Se tiver QUALQUER energia, tenta entregar ou ajudar
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        // --- 1. ENTREGA PRIORITÁRIA ---
        let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStructure;

        if (!target) {
            const sources = room.find(FIND_SOURCES);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => {
                    const isContainer = s.structureType === STRUCTURE_CONTAINER;
                    const notNearSource = !sources.some(source => s.pos.inRangeTo(source, 3));
                    return isContainer && notNearSource && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            }) as AnyStructure;
        }

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        // --- 2. TAREFAS DE AJUDA ---
        const toRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
        });
        if (toRepair) {
            if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) {
                creep.moveTo(toRepair, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
            creep.moveTo(room.controller!);
        }

    } else {
        // --- 3. COLETA ---
        const sources = room.find(FIND_SOURCES);
        const sourceContainers = room.find(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK) && 
                           sources.some(source => s.pos.inRangeTo(source, 3)) &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });

        if (sourceContainers.length > 0) {
            const target = creep.pos.findClosestByPath(sourceContainers);
            if (target && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
        });
        if (drop) {
            if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                creep.moveTo(drop, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
        
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 500) {
            if (creep.withdraw(room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.storage);
            }
        }
    }
}

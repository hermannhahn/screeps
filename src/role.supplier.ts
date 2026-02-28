// src/role.supplier.ts
export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.store.getUsedCapacity() === 0) {
        // --- COLETA ---
        // Encontrar containers/links que estão a até 3 blocos de sources
        const sources = room.find(FIND_SOURCES);
        const collectionPoints = room.find(FIND_STRUCTURES, {
            filter: (s) => {
                const isCollectionType = s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK;
                const nearSource = sources.some(source => s.pos.inRangeTo(source, 3));
                return isCollectionType && nearSource && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        // Caso não haja em containers, pegar do chão (drop) perto das sources
        if (collectionPoints.length > 0) {
            const target = creep.pos.findClosestByPath(collectionPoints);
            if (target && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            const drops = room.find(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (drops.length > 0) {
                const target = creep.pos.findClosestByPath(drops);
                if (target && creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        }
    } else {
        // --- ENTREGA ---
        // Prioridade 1: Spawn e Extensions
        let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        // Prioridade 2: Containers de entrega (NÃO estão perto de sources, ex: Controller Container)
        if (!target) {
            const sources = room.find(FIND_SOURCES);
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => {
                    const isContainer = s.structureType === STRUCTURE_CONTAINER;
                    const notNearSource = !sources.some(source => s.pos.inRangeTo(source, 3));
                    return isContainer && notNearSource && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
        }

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            // Se não houver onde entregar, dar upgrade para ajudar
            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            }
        }
    }
}

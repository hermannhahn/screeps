// src/role.supplier.ts
export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.store.getUsedCapacity() === 0) {
        // --- COLETA (Supplier) ---
        
        // 1. Container inRange de 3 blocos dos sources
        const sources = room.find(FIND_SOURCES);
        const sourceContainers = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                           sources.some(source => s.pos.inRangeTo(source, 3)) &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });
        if (sourceContainers.length > 0) {
            const target = creep.pos.findClosestByPath(sourceContainers);
            if (target && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }

        // 2. Link inRange de 3 blocos do Storage
        if (room.storage) {
            const storageLinks = room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_LINK && 
                               s.pos.inRangeTo(room.storage!, 3) &&
                               s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            });
            if (storageLinks.length > 0) {
                const target = creep.pos.findClosestByPath(storageLinks);
                if (target && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
                return;
            }
        }

        // 3. Drop mais próximo
        const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
        });
        if (drop) {
            if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                creep.moveTo(drop);
            }
            return;
        }

    } else {
        // --- ENTREGA (Supplier) ---
        // Prioridade 1: Spawn e Extensions
        let target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        // Prioridade 2: Outros Containers (ex: Controller Container)
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
                creep.moveTo(target);
            }
        } else {
            // Backup: Upgrade se nada mais precisar de energia
            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            }
        }
    }
}

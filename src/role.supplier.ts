// src/role.supplier.ts
export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.store.getUsedCapacity() === 0) {
        // --- COLETA (Supplier) ---
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

        // Se estiver vazio e não houver nada para coletar, pode ajudar a construir/reparar se houver energia sobrando no Storage
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 1000) {
            if (creep.withdraw(room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.storage);
            }
        }

    } else {
        // --- ENTREGA (Supplier) ---
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
        } else {
            // --- TAREFAS SECUNDÁRIAS (Reparo e Construção) ---
            // 1. Reparo (Prioridade em estruturas com menos de 80% de vida, exceto muros/ramparts no início)
            const toRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });
            if (toRepair) {
                if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(toRepair, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            // 2. Construção
            const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return;
            }

            // 3. Upgrade como último recurso
            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            }
        }
    }
}

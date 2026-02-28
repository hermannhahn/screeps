// src/role.supplier.ts
import { isTargetAvailable } from './tools';

export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.getActiveBodyparts(WORK) === 0) {
        creep.suicide();
        return;
    }

    if (creep.store.getUsedCapacity() === 0) {
        // --- COLETA ---
        const sources = room.find(FIND_SOURCES);
        
        // 1. Containers/Links de Coleta (perto de Source)
        const sourceContainers = room.find(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK) && 
                           sources.some(source => s.pos.inRangeTo(source, 3)) &&
                           isTargetAvailable(creep, s)
        });

        if (sourceContainers.length > 0) {
            const target = creep.pos.findClosestByPath(sourceContainers);
            if (target) {
                creep.memory.targetId = target.id;
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        }

        // 2. Drops
        const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && isTargetAvailable(creep, r)
        });
        if (drop) {
            creep.memory.targetId = drop.id;
            if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                creep.moveTo(drop, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
        
        // 3. Storage (se houver sobra e não tiver nada nas fontes)
        if (room.storage && isTargetAvailable(creep, room.storage) && room.storage.store[RESOURCE_ENERGY] > 500) {
            creep.memory.targetId = room.storage.id;
            if (creep.withdraw(room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.storage);
            }
            return;
        }

        // Se nada disponível, limpa o targetId
        delete creep.memory.targetId;

    } else {
        // --- ENTREGA ---
        delete creep.memory.targetId; // Limpa o alvo de coleta ao começar a entregar

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
            const toRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });
            if (toRepair) {
                if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(toRepair);
                }
                return;
            }

            const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(site);
                }
                return;
            }

            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            }
        }
    }
}

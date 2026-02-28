// src/role.builder.ts
import { isTargetAvailable } from './tools';

export function runBuilder(creep: Creep): void {
    if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.building = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
        creep.memory.building = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.building) {
        const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    } else {
        // --- COLETA DE ENERGIA ---
        
        // 1. Storage
        const storage = creep.room.storage;
        if (storage && storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && isTargetAvailable(creep, storage)) {
            creep.memory.targetId = storage.id;
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage);
            }
            return;
        }

        // 2. Container mais próximo
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 50 && isTargetAvailable(creep, s)
        });
        if (container) {
            creep.memory.targetId = container.id;
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
            return;
        }

        // 3. Drop mais próximo
        const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50 && isTargetAvailable(creep, r)
        });
        if (drop) {
            creep.memory.targetId = drop.id;
            if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                creep.moveTo(drop);
            }
            return;
        }

        // 4. Link mais próximo
        const link = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && isTargetAvailable(creep, s)
        });
        if (link) {
            creep.memory.targetId = link.id;
            if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(link);
            }
            return;
        }
        
        delete creep.memory.targetId;
    }
}

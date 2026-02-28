// src/role.upgrader.ts
import { isTargetAvailable } from './tools';

export function runUpgrader(creep: Creep): void {
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.upgrading = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
        creep.memory.upgrading = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    } else {
        // --- COLETA DE ENERGIA ---
        
        // 1. Container próximo ao Controller
        const controllerContainer = creep.room.controller!.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && isTargetAvailable(creep, s)
        })[0];
        if (controllerContainer) {
            creep.memory.targetId = controllerContainer.id;
            if (creep.withdraw(controllerContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(controllerContainer);
            }
            return;
        }

        // 2. Storage
        if (creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && isTargetAvailable(creep, creep.room.storage)) {
            creep.memory.targetId = creep.room.storage.id;
            if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage);
            }
            return;
        }

        // 3. Outros Containers
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

        // 4. Drops
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

        delete creep.memory.targetId;
    }
}

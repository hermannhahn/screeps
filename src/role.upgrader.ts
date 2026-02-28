// src/role.upgrader.ts
import { isTargetAvailable, getEnergyAmount } from './tools';

export function runUpgrader(creep: Creep): void {
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.upgrading = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
        creep.memory.upgrading = true;
        delete creep.memory.targetId;
    }

    // Validação do alvo de coleta
    if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (!target || getEnergyAmount(target) === 0) delete creep.memory.targetId;
    }

    if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
        }
    } else {
        // --- COLETAR ---
        if (!creep.memory.targetId) {
            const controllerContainer = creep.room.controller!.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0 && isTargetAvailable(creep, s)
            })[0];
            if (controllerContainer) creep.memory.targetId = controllerContainer.id;

            if (!creep.memory.targetId && creep.room.storage && isTargetAvailable(creep, creep.room.storage) && creep.room.storage.store[RESOURCE_ENERGY] > 0) {
                creep.memory.targetId = creep.room.storage.id;
            }
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target) {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                }
            }
        }
    }
}

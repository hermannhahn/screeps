// src/role.upgrader.ts
import { isTargetAvailable, getEnergyAmount, handleDefensiveState, sayAction } from './tools';

export function runUpgrader(creep: Creep): void {
    if (handleDefensiveState(creep)) return;

    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.upgrading = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
        creep.memory.upgrading = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (!target || getEnergyAmount(target) === 0) delete creep.memory.targetId;
    }

    if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
        } else {
            sayAction(creep, '⚡');
        }
    } else {
        // --- COLETA DE ENERGIA ---
        if (!creep.memory.targetId) {
            const controllerContainer = creep.room.controller!.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0 && isTargetAvailable(creep, s)
            })[0];
            if (controllerContainer) creep.memory.targetId = controllerContainer.id;

            if (!creep.memory.targetId && creep.room.storage && isTargetAvailable(creep, creep.room.storage) && creep.room.storage.store[RESOURCE_ENERGY] > 0) {
                creep.memory.targetId = creep.room.storage.id;
            }

            if (!creep.memory.targetId) {
                const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 50 && isTargetAvailable(creep, s)
                });
                if (container) creep.memory.targetId = container.id;
            }

            if (!creep.memory.targetId) {
                const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50 && isTargetAvailable(creep, r)
                });
                if (drop) creep.memory.targetId = drop.id;
            }
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target) {
                const res = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
                if (res === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                } else {
                    sayAction(creep, '📦');
                }
            }
        } else {
            if (creep.room.controller!.level <= 2) {
                const source = creep.pos.findClosestByPath(FIND_SOURCES, {
                    filter: (s) => s.energy > 0
                });
                if (source) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                    } else {
                        sayAction(creep, '⛏️');
                    }
                    return;
                }
            }
            sayAction(creep, '💤');
        }
    }
}

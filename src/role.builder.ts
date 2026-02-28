// src/role.builder.ts
import { isTargetAvailable, getEnergyAmount, handleDefensiveState, sayAction } from './tools';

export function runBuilder(creep: Creep): void {
    if (handleDefensiveState(creep)) return;

    if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.building = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
        creep.memory.building = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (!target || getEnergyAmount(target) === 0) delete creep.memory.targetId;
    }

    if (creep.memory.building) {
        if (!creep.memory.targetId) {
            const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            if (site) creep.memory.targetId = site.id;
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<ConstructionSite>);
            if (target) {
                if (creep.build(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
                } else {
                    sayAction(creep, '🔨');
                }
            } else {
                delete creep.memory.targetId;
            }
        } else {
            if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
            } else {
                sayAction(creep, '⚡');
            }
        }
    } else {
        if (!creep.memory.targetId) {
            const storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0 && isTargetAvailable(creep, storage)) {
                creep.memory.targetId = storage.id;
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
            sayAction(creep, '💤');
        }
    }
}

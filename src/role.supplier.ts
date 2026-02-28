// src/role.supplier.ts
import { isTargetAvailable, getEnergyAmount } from './tools';

export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.getActiveBodyparts(WORK) === 0) {
        creep.suicide();
        return;
    }

    if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (!target || getEnergyAmount(target) === 0) delete creep.memory.targetId;
        else if (creep.store.getFreeCapacity() === 0 && (target instanceof Resource || target instanceof StructureContainer || target instanceof StructureLink || target instanceof StructureStorage)) delete creep.memory.targetId;
        else if (creep.store.getUsedCapacity() === 0) delete creep.memory.targetId;
    }

    if (creep.store.getUsedCapacity() === 0) {
        if (!creep.memory.targetId) {
            const sources = room.find(FIND_SOURCES);
            const sourceContainers = room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK) && 
                               sources.some(source => s.pos.inRangeTo(source, 3)) &&
                               isTargetAvailable(creep, s)
            });
            if (sourceContainers.length > 0) {
                const target = creep.pos.findClosestByPath(sourceContainers);
                if (target) creep.memory.targetId = target.id;
            }
            if (!creep.memory.targetId) {
                const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && isTargetAvailable(creep, r)
                });
                if (drop) creep.memory.targetId = drop.id;
            }
            if (!creep.memory.targetId && room.storage && isTargetAvailable(creep, room.storage) && room.storage.store[RESOURCE_ENERGY] > 500) {
                creep.memory.targetId = room.storage.id;
            }
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target) {
                const res = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
                if (res === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                } else {
                    creep.say('📦');
                }
            }
        } else {
            creep.say('💤');
        }

    } else {
        if (!creep.memory.targetId) {
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
            if (target) creep.memory.targetId = target.id;
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target && target.store && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
                } else {
                    creep.say('📥');
                }
            } else {
                delete creep.memory.targetId;
            }
        } else {
            const toRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });
            if (toRepair) {
                if (creep.repair(toRepair) === ERR_NOT_IN_RANGE) creep.moveTo(toRepair);
                else creep.say('🔧');
                return;
            }

            const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE) creep.moveTo(site);
                else creep.say('🔨');
                return;
            }

            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            } else {
                creep.say('⚡');
            }
        }
    }
}

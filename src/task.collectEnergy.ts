import _ from 'lodash';
import { findControllerContainer } from './blueprints/utils';

const taskCollectEnergy = {
    run: function(creep: Creep) {
        if (creep.memory.assignedSupplier) {
            const supplier = Game.getObjectById(creep.memory.assignedSupplier as Id<Creep>);
            if (supplier && supplier.store[RESOURCE_ENERGY] > 0) {
                if (creep.pos.getRangeTo(supplier) > 1) {
                    creep.moveTo(supplier, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            } else {
                delete creep.memory.assignedSupplier;
            }
        }

        // Validate existing targetEnergyId
        if (creep.memory.targetEnergyId) {
            const target = Game.getObjectById(creep.memory.targetEnergyId as Id<any>);
            if (!target) { // If target doesn't exist
                delete creep.memory.targetEnergyId;
            } else if (target instanceof Resource) { // If it's a dropped resource
                if (target.amount === 0) {
                    delete creep.memory.targetEnergyId;
                }
            } else if ('store' in target) { // If it's a structure with a store
                if ((target as any).store[RESOURCE_ENERGY] === 0) {
                    delete creep.memory.targetEnergyId;
                }
            } else { // It's an object that is not a Resource and does not have a store (e.g., a Source, Controller, or unknown structure type)
                delete creep.memory.targetEnergyId; // Invalidate target if it's not a valid energy source
            }
        }

        if (!creep.memory.targetEnergyId) {
            const targetedByOthers = _.compact(_.map(Game.creeps, (c: Creep) => {
                if (c.id !== creep.id && c.room.name === creep.room.name && c.memory.targetEnergyId) {
                    return c.memory.targetEnergyId;
                }
                return null;
            })) as Id<any>[];

            // Priority 1: Dropped Energy
            const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0 &&
                    (!targetedByOthers.includes(r.id) || r.amount >= creep.store.getCapacity() * 4)
            }).sort((a, b) => b.amount - a.amount);

            if (droppedEnergy.length > 0) {
                creep.memory.targetEnergyId = droppedEnergy[0].id as Id<any>;
            }

            // Priority 1.5: Controller Container (especially for upgraders)
            if (!creep.memory.targetEnergyId) {
                const controllerContainer = findControllerContainer(creep.room);
                if (controllerContainer && 'store' in controllerContainer && controllerContainer.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    creep.memory.targetEnergyId = controllerContainer.id as Id<any>;
                }
            }

            // Priority 2: Containers near Sources
            if (!creep.memory.targetEnergyId) {
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType === STRUCTURE_CONTAINER) &&
                        s.store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
                        (!targetedByOthers.includes(s.id) || s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity() * 4)
                }) as StructureContainer[];

                const containersNearSources = containers.filter(container => {
                    return creep.room.find(FIND_SOURCES).some(source => container.pos.getRangeTo(source) <= 3);
                }).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));

                if (containersNearSources.length > 0) {
                    creep.memory.targetEnergyId = containersNearSources[0].id as Id<any>;
                }
            }

            // Priority 3: Storage
            if (!creep.memory.targetEnergyId) {
                const storage = creep.room.storage;
                if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                    creep.memory.targetEnergyId = storage.id as Id<any>;
                }
            }
        }

        if (creep.memory.targetEnergyId) {
            const energyTarget = Game.getObjectById(creep.memory.targetEnergyId as Id<any>);
            if (energyTarget) {
                let result;
                if (energyTarget instanceof Resource) {
                    result = creep.pickup(energyTarget);
                } else {
                    result = creep.withdraw(energyTarget, RESOURCE_ENERGY);
                }

                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(energyTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (result === OK || result === ERR_FULL) {
                    delete creep.memory.targetEnergyId;
                }
            } else {
                delete creep.memory.targetEnergyId;
            }
        } else {
            if (creep.room.controller && creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
    }
};

export default taskCollectEnergy;

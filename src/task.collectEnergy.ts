import _ from 'lodash';
import { findControllerContainer } from './blueprints/utils';
import { getIncomingCollection } from './utils.creep';

const taskCollectEnergy = {
    run: function(creep: Creep) {
        if (creep.memory.assignedSupplier) {
            const supplier = Game.getObjectById(creep.memory.assignedSupplier as Id<Creep>);
            if (supplier && supplier.store[RESOURCE_ENERGY] > 0) {
                if (creep.pos.getRangeTo(supplier) > 1) {
                    creep.moveTo(supplier, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
            delete creep.memory.assignedSupplier;
        }

        let target = creep.memory.targetEnergyId ? Game.getObjectById(creep.memory.targetEnergyId as Id<any>) : null;
        
        if (target) {
            const hasEnergy = 'store' in target ? target.store[RESOURCE_ENERGY] > 0 : (target instanceof Resource ? target.amount > 0 : false);
            if (!hasEnergy) {
                delete creep.memory.targetEnergyId;
                target = null;
            }
        }

        if (!target) {
            // Priority 1: Dropped Energy
            const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > getIncomingCollection(r.id)
            });
            if (dropped.length > 0) target = _.maxBy(dropped, (r: Resource) => r.amount) || null;

            // Priority 2: Source Containers
            if (!target) {
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                        s.store.getUsedCapacity(RESOURCE_ENERGY) > getIncomingCollection(s.id) &&
                        creep.room.find(FIND_SOURCES).some(src => s.pos.getRangeTo(src) <= 3)
                });
                if (containers.length > 0) target = creep.pos.findClosestByRange(containers);
            }

            // Priority 3: Storage
            if (!target && creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > getIncomingCollection(creep.room.storage.id)) {
                target = creep.room.storage;
            }

            // Priority 4: Controller Container
            if (!target) {
                const ctrlContainer = findControllerContainer(creep.room);
                if (ctrlContainer && 'store' in ctrlContainer && ctrlContainer.store.getUsedCapacity(RESOURCE_ENERGY) > getIncomingCollection(ctrlContainer.id)) {
                    target = ctrlContainer;
                }
            }

            if (target) creep.memory.targetEnergyId = target.id;
        }

        if (target) {
            const result = target instanceof Resource ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else if (result === OK || result === ERR_FULL) {
                delete creep.memory.targetEnergyId;
            }
        } else {
            if (creep.room.controller && creep.pos.getRangeTo(creep.room.controller) > 3) {
                creep.moveTo(creep.room.controller);
            }
        }
    }
};

export default taskCollectEnergy;

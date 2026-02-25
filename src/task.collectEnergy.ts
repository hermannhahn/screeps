import _ from 'lodash';
import { getIncomingCollection } from './utils.creep';

/**
 * GENERIC ENERGY COLLECTION TASK
 * Priorities:
 * 1. Dropped Energy (Decays, so high priority)
 * 2. General Containers (Closest available)
 * 3. Storage
 */
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

        const myFreeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
        let target = creep.memory.targetEnergyId ? Game.getObjectById(creep.memory.targetEnergyId as Id<any>) : null;
        
        // Re-validate existing target
        if (target) {
            const amount = 'store' in target ? target.store[RESOURCE_ENERGY] : (target instanceof Resource ? target.amount : 0);
            const incoming = getIncomingCollection(target.id);
            const availableForMe = amount - (incoming - myFreeCapacity);

            if (availableForMe <= 0) {
                delete creep.memory.targetEnergyId;
                target = null;
            }
        }

        if (!target) {
            const getScore = (t: any) => {
                const amount = 'store' in t ? t.store[RESOURCE_ENERGY] : (t instanceof Resource ? t.amount : 0);
                const available = amount - getIncomingCollection(t.id);
                if (available <= 0) return -1;
                
                const distance = creep.pos.getRangeTo(t);
                return (available * available) / Math.max(distance, 1);
            };

            // Priority 1: Dropped Energy
            const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && (r.amount - getIncomingCollection(r.id)) > 0
            });
            if (dropped.length > 0) {
                target = _.maxBy(dropped, (r) => getScore(r)) || null;
            }

            // Priority 2: General Containers (Closest)
            if (!target) {
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                        (s.store.getUsedCapacity(RESOURCE_ENERGY) - getIncomingCollection(s.id)) > 0
                });
                if (containers.length > 0) {
                    target = creep.pos.findClosestByRange(containers);
                }
            }

            // Priority 3: Storage
            if (!target && creep.room.storage && (creep.room.storage.store[RESOURCE_ENERGY] - getIncomingCollection(creep.room.storage.id)) > 0) {
                target = creep.room.storage;
            }

            if (target) creep.memory.targetEnergyId = target.id;
        }

        if (target) {
            const result = target instanceof Resource ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00', opacity: 0.5 } });
            } else if (result === OK || result === ERR_FULL || result === ERR_NOT_ENOUGH_RESOURCES) {
                delete creep.memory.targetEnergyId;
            }
        } else {
            // Idle behavior
            if (creep.room.controller && creep.pos.getRangeTo(creep.room.controller) > 3) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.2 } });
            }
        }
    }
};

export default taskCollectEnergy;

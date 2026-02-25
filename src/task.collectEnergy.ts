import _ from 'lodash';
import { getIncomingCollection } from './utils.creep';

/**
 * GENERIC ENERGY COLLECTION TASK
 * Priorities:
 * 1. Immediate Proximity (Any source within range 3)
 * 2. General Containers (Closest available)
 * 3. Storage
 * 4. Dropped Energy (Score based)
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
            // Helper to check availability considering incoming
            const getAvailable = (t: any) => {
                const amount = 'store' in t ? t.store[RESOURCE_ENERGY] : (t instanceof Resource ? t.amount : 0);
                return amount - getIncomingCollection(t.id);
            };

            // Priority 1: Immediate Proximity (If something is right next to us, take it)
            const nearby = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                    getAvailable(s) > (myFreeCapacity * 0.5) // At least half of what we need
            });
            if (nearby.length > 0) {
                target = creep.pos.findClosestByRange(nearby);
            }

            // Priority 2: General Containers (Closest)
            if (!target) {
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && getAvailable(s) > 0
                });
                if (containers.length > 0) {
                    target = creep.pos.findClosestByRange(containers);
                }
            }

            // Priority 3: Storage
            if (!target && creep.room.storage && getAvailable(creep.room.storage) > 0) {
                target = creep.room.storage;
            }

            // Priority 4: Dropped Energy (Fallback with balanced score)
            if (!target) {
                const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && getAvailable(r) > 50 // Don't cross the map for 10 energy
                });
                if (dropped.length > 0) {
                    target = _.maxBy(dropped, (r) => {
                        const available = getAvailable(r);
                        const distance = creep.pos.getRangeTo(r);
                        return available / Math.max(distance, 1);
                    }) || null;
                }
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

import _ from 'lodash';
import { findControllerContainer } from './blueprints/utils';
import { getIncomingEnergy } from './utils.creep';

const taskDeliver = {
    run: function(creep: Creep): boolean {
        const myEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        let target: any = null;

        if (creep.memory.deliveryTargetId) {
            target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
            if (target) {
                const freeCapacity = target.store.getFreeCapacity(RESOURCE_ENERGY);
                const incoming = getIncomingEnergy(target.id);
                // Available capacity for me = Total free - (what others are bringing)
                // We subtract our own contribution from 'incoming'
                const availableForMe = freeCapacity - (incoming - myEnergy);

                if (availableForMe <= 0) {
                    if (target instanceof Creep && target.memory.assignedSupplier === creep.id) {
                        delete target.memory.assignedSupplier;
                    }
                    delete creep.memory.deliveryTargetId;
                    target = null;
                }
            }
        }

        if (!target) {
            const getScore = (t: any) => {
                const free = t.store.getFreeCapacity(RESOURCE_ENERGY);
                const available = free - getIncomingEnergy(t.id);
                if (available <= 0) return -1;
                
                const distance = creep.pos.getRangeTo(t);
                // Score favors structures that need more energy and are closer
                return available / Math.max(distance, 1);
            };

            // Priority 1: Spawns and Extensions
            const coreStructures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                    (s.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(s.id)) > 0
            });

            if (coreStructures.length > 0) {
                target = _.maxBy(coreStructures, (s) => getScore(s)) || null;
            }

            // Priority 2: Towers
            if (!target) {
                const towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_TOWER &&
                        (s.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(s.id)) > 400
                });
                if (towers.length > 0) {
                    target = _.maxBy(towers, (t) => getScore(t)) || null;
                }
            }

            // Priority 3: Creeps in need
            if (!target) {
                const needyCreeps = creep.room.find(FIND_CREEPS, {
                    filter: (c) => (c.memory.role === 'upgrader' || c.memory.role === 'builder') &&
                        (c.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(c.id)) > 0 &&
                        !c.memory.assignedSupplier
                });
                if (needyCreeps.length > 0) {
                    target = _.maxBy(needyCreeps, (c) => getScore(c)) || null;
                    if (target) {
                        target.memory.assignedSupplier = creep.id;
                    }
                }
            }

            // Priority 4: Controller Container
            if (!target) {
                const controllerContainer = findControllerContainer(creep.room);
                if (controllerContainer && 'store' in controllerContainer && 
                    (controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(controllerContainer.id)) > 0) {
                    target = controllerContainer;
                }
            }

            if (target) {
                creep.memory.deliveryTargetId = target.id;
            }
        }

        if (target) {
            const result = creep.transfer(target, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5 } });
            } else if (result === OK || result === ERR_FULL || result === ERR_INVALID_TARGET) {
                if (target instanceof Creep && target.memory.assignedSupplier === creep.id) {
                    delete target.memory.assignedSupplier;
                }
                delete creep.memory.deliveryTargetId;
            }
            return true;
        }

        return false;
    }
};

export default taskDeliver;

import _ from 'lodash';
import { findControllerContainer } from './blueprints/utils';
import { getIncomingEnergy } from './utils.creep';

const taskDeliver = {
    run: function(creep: Creep): boolean {
        let target: any = null;

        if (creep.memory.deliveryTargetId) {
            target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
            const hasSpace = target && ('store' in target ? target.store.getFreeCapacity(RESOURCE_ENERGY) > 0 : target.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            if (!target || !hasSpace) {
                delete creep.memory.deliveryTargetId;
                target = null;
            }
        }

        if (!target) {
            // Priority 1: Spawns and Extensions
            const coreStructures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > getIncomingEnergy(s.id)
            });

            if (coreStructures.length > 0) {
                target = creep.pos.findClosestByRange(coreStructures);
            }

            // Priority 2: Towers
            if (!target) {
                const towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_TOWER &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 400 + getIncomingEnergy(s.id)
                });
                if (towers.length > 0) {
                    target = creep.pos.findClosestByRange(towers);
                }
            }

            // Priority 3: Creeps in need
            if (!target) {
                const needyCreeps = creep.room.find(FIND_CREEPS, {
                    filter: (c) => (c.memory.role === 'upgrader' || c.memory.role === 'builder') &&
                        c.store.getFreeCapacity(RESOURCE_ENERGY) > getIncomingEnergy(c.id) &&
                        !c.memory.assignedSupplier
                });
                if (needyCreeps.length > 0) {
                    target = creep.pos.findClosestByRange(needyCreeps);
                    if (target) {
                        target.memory.assignedSupplier = creep.id;
                    }
                }
            }

            // Priority 4: Controller Container
            if (!target) {
                const controllerContainer = findControllerContainer(creep.room);
                if (controllerContainer && 'store' in controllerContainer && 
                    controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) > getIncomingEnergy(controllerContainer.id)) {
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
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            } else if (result === OK || result === ERR_FULL) {
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

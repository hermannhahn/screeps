import _ from 'lodash';
import { findControllerContainer } from './blueprints/utils';
import { getIncomingEnergy } from './utils.creep';
import { cacheUtils } from './utils.cache';

const taskDeliver = {
    run: function(creep: Creep): boolean {
        const myEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        let target: any = null;

        if (creep.memory.deliveryTargetId) {
            target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
            if (target) {
                const freeCapacity = target.store.getFreeCapacity(RESOURCE_ENERGY);
                const incoming = getIncomingEnergy(target.id);
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
                const amountToDeliver = Math.min(myEnergy, available);
                return amountToDeliver / Math.max(distance, 1);
            };

            // Priority 1: Spawns and Extensions
            const coreStructures = cacheUtils.findInRoom(creep.room, FIND_STRUCTURES, (s: any) => 
                (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                (s.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(s.id)) > 0
            , 1);

            if (coreStructures.length > 0) {
                target = _.maxBy(coreStructures, (s) => getScore(s)) || null;
            }

            // Priority 2: Towers
            if (!target) {
                const towers = cacheUtils.findInRoom(creep.room, FIND_STRUCTURES, (s: any) => 
                    s.structureType === STRUCTURE_TOWER &&
                    (s.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(s.id)) > 100
                , 1);
                if (towers.length > 0) {
                    target = _.maxBy(towers, (t) => getScore(t)) || null;
                }
            }

            // Priority 3: Creeps in need (Upgraders/Builders)
            if (!target) {
                const needyCreeps = cacheUtils.findInRoom(creep.room, FIND_CREEPS, (c: any) => 
                    (c.memory.role === 'upgrader' || c.memory.role === 'builder') &&
                    (c.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(c.id)) > 20 &&
                    !c.memory.assignedSupplier
                , 1);
                if (needyCreeps.length > 0) {
                    target = _.maxBy(needyCreeps, (c) => getScore(c)) || null;
                    if (target) {
                        target.memory.assignedSupplier = creep.id;
                    }
                }
            }

            // Priority 4: Storage (Primary buffer)
            if (!target && creep.room.storage && (creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(creep.room.storage.id)) > 0) {
                target = creep.room.storage;
            }

            // Priority 5: Terminal (For market/shipping)
            if (!target && creep.room.terminal && (creep.room.terminal.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(creep.room.terminal.id)) > 10000) {
                // Only fill terminal if storage has a decent amount or terminal is very empty
                const storageEnergy = creep.room.storage ? creep.room.storage.store[RESOURCE_ENERGY] : 0;
                if (storageEnergy > 50000 || creep.room.terminal.store[RESOURCE_ENERGY] < 10000) {
                    target = creep.room.terminal;
                }
            }

            // Priority 6: Controller Container
            if (!target) {
                const controllerContainer = findControllerContainer(creep.room);
                if (controllerContainer && 'store' in controllerContainer && 
                    (controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(controllerContainer.id)) > 0) {
                    target = controllerContainer;
                }
            }

            // Priority 7: General Containers
            if (!target) {
                const sources = cacheUtils.getSources(creep.room);
                const generalContainers = cacheUtils.findInRoom(creep.room, FIND_STRUCTURES, (s: any) => 
                    s.structureType === STRUCTURE_CONTAINER &&
                    (s.store.getFreeCapacity(RESOURCE_ENERGY) - getIncomingEnergy(s.id)) > 0 &&
                    !sources.some(src => s.pos.getRangeTo(src) <= 3) &&
                    (creep.room.controller ? s.pos.getRangeTo(creep.room.controller) > 3 : true)
                , 5);
                if (generalContainers.length > 0) {
                    target = _.maxBy(generalContainers, (c) => getScore(c)) || null;
                }
            }

            if (target) {
                creep.memory.deliveryTargetId = target.id;
                creep.say('📦');
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

import _ from 'lodash';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';
import { findSourceContainer } from './blueprints/utils'; // Corrected import

const roleSupplier = {
    run: function(creep: Creep) {
                if (creep.store.getUsedCapacity() === 0) {
                    let targetEnergy: any = null;
                    if (creep.memory.targetEnergyId) {
                        const storedTarget = Game.getObjectById(creep.memory.targetEnergyId as Id<any>);
                                            if (storedTarget) {
                                                let isValidTarget = false;
                                                if ('resourceType' in storedTarget && storedTarget.resourceType === RESOURCE_ENERGY) { // Check if it's a dropped resource
                                                    if (storedTarget.amount > 0) {
                                                        isValidTarget = true;
                                                    }
                                                } else if ('store' in storedTarget) { // Check if it's a structure with a store
                                                    if (storedTarget.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                                                        isValidTarget = true;
                                                    }
                                                }
                        
                                                if (isValidTarget) {
                                                    targetEnergy = storedTarget;
                                                } else {
                                                    delete creep.memory.targetEnergyId;
                                                }
                                            } else { // storedTarget is null or undefined
                                                delete creep.memory.targetEnergyId;
                                            }                    }
        
                                const targetedByOthers = _.compact(_.map(Game.creeps, (c: Creep) => {
                                    if (c.id !== creep.id && c.room.name === creep.room.name && c.memory.targetEnergyId) {
                                        return c.memory.targetEnergyId;
                                    }
                                    return null;
                                })) as Id<any>[];
                    
                                if (!targetEnergy) {
                                    // Priority 1: Dropped resources
                                    const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                                        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50 && // Minimum amount to pick up
                                            !targetedByOthers.includes(r.id)
                                    });
                                    if (droppedEnergy.length > 0) {
                                        targetEnergy = droppedEnergy[0];
                                    }
                                }
                    
                                if (!targetEnergy) {
                                    // Priority 2: Source containers (from the blueprint)
                                    const sources = creep.room.find(FIND_SOURCES);
                                    for (const source of sources) {
                                        const sourceContainer = findSourceContainer(source);
                                        // Ensure it's a built container and has energy
                                                            if (sourceContainer && (sourceContainer.structureType === STRUCTURE_CONTAINER) ) { // Only proceed if it's a built container
                                                                const builtContainer = sourceContainer as StructureContainer;
                                                                if (builtContainer.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity()) {
                                                                    if (!targetedByOthers.includes(builtContainer.id) || builtContainer.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity() * 4) {
                                                                        targetEnergy = builtContainer;
                                                                        break;
                                                                    }
                                                                }
                                                            }                                    }
                                }        
                    if (!targetEnergy) {
                        // Priority 3: Other containers or storages
                        const containersAndStorage = creep.room.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                                (s as any).store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity(RESOURCE_ENERGY) &&
                                !targetedByOthers.includes(s.id)
                        }) as (StructureContainer | StructureStorage)[];
        
                        if (containersAndStorage.length > 0) {
                            targetEnergy = containersAndStorage[0];
                        }
                    }
        
                    if (targetEnergy) {
                        let collectResult;
                        if (targetEnergy.resourceType === RESOURCE_ENERGY) {
                            collectResult = creep.pickup(targetEnergy);
                        } else {
                            collectResult = creep.withdraw(targetEnergy, RESOURCE_ENERGY);
                        }
        
                        if (collectResult === ERR_NOT_IN_RANGE) {
                            creep.moveTo(targetEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
                            creep.memory.targetEnergyId = targetEnergy.id; // Store target if moving
                        } else if (collectResult === OK || collectResult === ERR_FULL) {
                            delete creep.memory.targetEnergyId;
                        }
                    }
                } else {
            let target = null;
            if (creep.memory.deliveryTargetId) {
                target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
                if (!target || (target.store && target.store.getFreeCapacity(RESOURCE_ENERGY) === 0)) {
                    delete creep.memory.deliveryTargetId;
                    target = null;
                }
            }

            if (!target) {
                // Prioritize spawns
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_SPAWN &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            }

            if (!target) {
                // Then extensions
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_EXTENSION &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_CREEPS, {
                    filter: (c) => c.memory && (c.memory.role === 'upgrader' || c.memory.role === 'builder') &&
                        c.store[RESOURCE_ENERGY] === 0 &&
                        !c.memory.assignedSupplier
                });

                if (target) {
                    target.memory.assignedSupplier = creep.id;
                    creep.memory.deliveryTargetId = target.id;
                }
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            }

            if (target) {
                const transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if (transferResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                } else if (transferResult === OK || transferResult === ERR_FULL) {
                    const deliveryTarget = Game.getObjectById(creep.memory.deliveryTargetId as Id<Creep>);
                    if (deliveryTarget && deliveryTarget.memory && deliveryTarget.memory.assignedSupplier === creep.id) {
                        delete deliveryTarget.memory.assignedSupplier;
                    }
                    delete creep.memory.deliveryTargetId;
                }
            } else {
                if (!taskBuild.run(creep)) {
                    taskUpgrade.run(creep);
                }
            }
        }
    }
};

export default roleSupplier;

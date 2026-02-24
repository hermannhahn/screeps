import _ from 'lodash';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';
import taskRepair from './task.repair';
import { findSourceContainer, findControllerContainer } from './blueprints/utils'; // Corrected import

const roleSupplier = {
    run: function(creep: Creep) {
        // Toggle state: if empty, go collect. If full OR has energy and no more space, go deliver.
        if (creep.memory.delivering && creep.store.getUsedCapacity() === 0) {
            creep.memory.delivering = false;
            delete creep.memory.deliveryTargetId;
            delete creep.memory.targetRepairId;
            delete creep.memory.targetBuildId;
            creep.say('🔄 collect');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            delete creep.memory.targetEnergyId;
            creep.say('📦 deliver');
        }

        // Emergency state fix: if creep has energy but not in delivering state AND no energy found to collect
        // it should probably switch to delivering to avoid being stuck.
        if (!creep.memory.delivering && creep.store.getUsedCapacity() > 0) {
            // Check if there is even energy to collect
            // This is a bit expensive but helps prevent being stuck
            // For now, let's just allow it to switch if it has some energy and no target
            if (!creep.memory.targetEnergyId) {
                 // We don't force it here yet, let the normal logic try to find energy first
            }
        }

        if (!creep.memory.delivering) {
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
                                                        // RESTRICTION: Suppliers should never withdraw from Controller Container unless no harvesters
                                                        const controllerContainer = findControllerContainer(creep.room);
                                                        const isControllerContainer = controllerContainer && 'id' in controllerContainer && controllerContainer.id === storedTarget.id;
                                                        const harvestersCount = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === creep.room.name).length;

                                                        if (!isControllerContainer || harvestersCount === 0) {
                                                            isValidTarget = true;
                                                        }
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
                                                            if (sourceContainer && sourceContainer.structureType === STRUCTURE_CONTAINER && ('store' in sourceContainer) ) { // Check if it's a built container WITH a store
                                                                const builtContainer = sourceContainer as StructureContainer;
                                                                if (builtContainer.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity()) {
                                                                    if (!targetedByOthers.includes(builtContainer.id)) {
                                                                        targetEnergy = builtContainer;
                                                                        break;
                                                                    }
                                                                }
                                                            }                                    }
                                }        
                    if (!targetEnergy) {
                        // Priority 3: Other containers or storages
                        const harvestersCount = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === creep.room.name).length;
                        const controllerContainer = findControllerContainer(creep.room);
                        const controllerContainerId = controllerContainer && 'id' in controllerContainer ? controllerContainer.id : null;

                        const containersAndStorage = creep.room.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                                (s as any).store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity(RESOURCE_ENERGY) &&
                                !targetedByOthers.includes(s.id) &&
                                (s.id !== controllerContainerId || harvestersCount === 0) // Restriction applied here
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
                    } else if (creep.store.getUsedCapacity() > 0) {
                        // Fallback: If no energy to collect but has some energy, go deliver
                        creep.memory.delivering = true;
                        creep.say('📦 force deliver');
                    }
                } else {
            let target = null;
            if (creep.memory.deliveryTargetId) {
                target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
                // Validate target: exists, has capacity, and if it's a creep, it still needs energy
                let isValid = !!target;
                if (target) {
                    if ('store' in target) {
                        isValid = target.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    } else if (target instanceof Creep) {
                        isValid = target.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                }
                
                if (!isValid) {
                    delete creep.memory.deliveryTargetId;
                    target = null;
                }
            }

            const targetedByOthersDelivery = _.compact(_.map(Game.creeps, (c: Creep) => {
                if (c.id !== creep.id && c.room.name === creep.room.name && c.memory.deliveryTargetId) {
                    return c.memory.deliveryTargetId;
                }
                return null;
            })) as Id<any>[];

            if (!target) {
                // Prioritize spawns
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_SPAWN &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                        !targetedByOthersDelivery.includes(s.id)
                });
            }

            if (!target) {
                // Then extensions
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_EXTENSION &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                        !targetedByOthersDelivery.includes(s.id)
                });
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_CREEPS, {
                    filter: (c) => c.memory && (c.memory.role === 'upgrader' || c.memory.role === 'builder') &&
                        c.store[RESOURCE_ENERGY] === 0 &&
                        !c.memory.assignedSupplier &&
                        !targetedByOthersDelivery.includes(c.id as any)
                });

                if (target) {
                    target.memory.assignedSupplier = creep.id;
                    creep.memory.deliveryTargetId = target.id;
                }
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_TOWER && 
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                        !targetedByOthersDelivery.includes(s.id)
                });
            }

            if (!target) {
                // Finally, fill the Controller Container
                const controllerContainer = findControllerContainer(creep.room);
                if (controllerContainer && 'store' in controllerContainer && 
                    controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                    !targetedByOthersDelivery.includes(controllerContainer.id)) {
                    target = controllerContainer;
                }
            }

            if (target) {
                creep.memory.deliveryTargetId = target.id;
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
                // Fallback: Help with other tasks if carrying energy
                if (!taskRepair.run(creep)) {
                    if (!taskBuild.run(creep)) {
                        taskUpgrade.run(creep);
                    }
                }
            }
        }
    }
};

export default roleSupplier;

import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

const roleSupplier = {
    run: function(creep: Creep) {
        if (creep.store.getUsedCapacity() === 0) {
            const sources = creep.room.find(FIND_SOURCES);
            let targetEnergy: any = null;
            if (creep.memory.targetEnergyId) {
                const storedTarget = Game.getObjectById(creep.memory.targetEnergyId as Id<any>);
                if (storedTarget &&
                    ((storedTarget.resourceType === RESOURCE_ENERGY && storedTarget.amount > 0) ||
                        (storedTarget.store && storedTarget.store.getUsedCapacity(RESOURCE_ENERGY) > 0))) {
                    targetEnergy = storedTarget;
                } else {
                    delete creep.memory.targetEnergyId;
                }
            }

            if (!targetEnergy) {
                for (const source of sources) {
                    const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= creep.store.getCapacity() * 2
                    });
                    if (dropped.length > 0) {
                        targetEnergy = dropped[0];
                        creep.memory.targetEnergyId = targetEnergy.id;
                        break;
                    }

                    const structures = source.pos.findInRange(FIND_STRUCTURES, 3, {
                        filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                            s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity(RESOURCE_ENERGY)
                    }) as (StructureContainer | StructureStorage)[];
                    if (structures.length > 0) {
                        targetEnergy = structures[0];
                        creep.memory.targetEnergyId = targetEnergy.id;
                        break;
                    }
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
                } else if (collectResult === OK) {
                    if (creep.store.getFreeCapacity() === 0 ||
                        (targetEnergy.resourceType === RESOURCE_ENERGY && targetEnergy.amount === 0) ||
                        (targetEnergy.store && targetEnergy.store.getUsedCapacity(RESOURCE_ENERGY) === 0)) {
                        delete creep.memory.targetEnergyId;
                    }
                }
            }
        } else {
            let target = null;
            if (creep.memory.deliveryTargetId) {
                target = Game.getObjectById(creep.memory.deliveryTargetId as Id<any>);
                if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    delete creep.memory.deliveryTargetId;
                    target = null;
                }
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
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

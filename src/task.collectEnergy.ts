const taskCollectEnergy = {
    run: function(creep: Creep) {
        let energyTarget: any = null;
        let assignedSupplierActive = false;

        if (creep.memory.assignedSupplier) {
            const supplier = Game.getObjectById(creep.memory.assignedSupplier as Id<Creep>);
            if (supplier && supplier.store[RESOURCE_ENERGY] > 0) {
                if (creep.pos.getRangeTo(supplier) > 1) {
                    creep.moveTo(supplier, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                assignedSupplierActive = true;
            } else {
                delete creep.memory.assignedSupplier;
            }
        }

        if (!assignedSupplierActive) {
            const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 0
            }).sort((a, b) => b.amount - a.amount);

            if (droppedEnergy.length > 0) {
                energyTarget = droppedEnergy[0];
            }

            if (!energyTarget) {
                const containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType === STRUCTURE_CONTAINER) &&
                        s.store[RESOURCE_ENERGY] > 0
                }) as StructureContainer[];

                const containersNearSources = containers.filter(container => {
                    return creep.room.find(FIND_SOURCES).some(source => container.pos.getRangeTo(source) <= 3);
                }).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));

                if (containersNearSources.length > 0) {
                    energyTarget = containersNearSources[0];
                }
            }

            if (!energyTarget) {
                const storage = creep.room.storage;
                if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                    energyTarget = storage;
                }
            }

            if (energyTarget) {
                if (creep.withdraw(energyTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE || creep.pickup(energyTarget) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(energyTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                if (creep.room.controller && creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    }
};

export default taskCollectEnergy;

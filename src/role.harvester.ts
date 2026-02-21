const roleHarvester = {
    run: function(creep: Creep) {
        const hostileCreepsInRoom = creep.room.find(FIND_HOSTILE_CREEPS);
        const extensions = creep.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const hasEnoughExtensions = extensions.length >= 5;

        const threateningHostiles = creep.pos.findInRange(hostileCreepsInRoom, 3);
        if (threateningHostiles.length > 0 && hasEnoughExtensions) {
            const closestHostile = creep.pos.findClosestByRange(threateningHostiles);
            if (closestHostile) {
                const fleePath = PathFinder.search(
                    creep.pos,
                    { pos: closestHostile.pos, range: 5 },
                    {
                        flee: true,
                        plainCost: 1,
                        swampCost: 5,
                        roomCallback: (roomName) => {
                            let room = Game.rooms[roomName];
                            if (!room) return new PathFinder.CostMatrix();
                            let costMatrix = new PathFinder.CostMatrix();
                            room.find(FIND_HOSTILE_CREEPS).forEach(c => costMatrix.set(c.pos.x, c.pos.y, 255));
                            room.find(FIND_STRUCTURES).forEach(struct => {
                                if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_RAMPART) {
                                    costMatrix.set(struct.pos.x, struct.pos.y, 255);
                                }
                            });
                            room.find(FIND_CONSTRUCTION_SITES).forEach(site => {
                                if (site.structureType !== STRUCTURE_ROAD && site.structureType !== STRUCTURE_CONTAINER && site.structureType !== STRUCTURE_RAMPART) {
                                    costMatrix.set(site.pos.x, site.pos.y, 255);
                                }
                            });
                            return costMatrix;
                        },
                    }
                );
                if (fleePath.path.length > 0) {
                    creep.moveTo(fleePath.path[0], { visualizePathStyle: { stroke: '#00ffff' } });
                    return;
                }
            }
        }

        if (creep.store.getFreeCapacity() > 0) {
            const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
            if (source) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                }
            } else {
                creep.say('❓ NoSource');
                const sources = creep.room.find(FIND_SOURCES);
                if (sources.length > 0) {
                    creep.memory.sourceId = sources[0].id;
                }
            }
        } else {
            const suppliers = creep.room.find(FIND_MY_CREEPS, {
                filter: (c) => c.memory.role === 'supplier'
            });

            if (suppliers.length > 0) {
                const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                        creep.pos.getRangeTo(s) <= 2
                });

                if (container) {
                    if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(container);
                    }
                } else {
                    creep.drop(RESOURCE_ENERGY);
                }
            } else {
                const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
            }
        }
    }
};

export default roleHarvester;

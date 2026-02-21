import _ from 'lodash';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

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
                creep.say('⚡ Harvest');
                const harvestResult = creep.harvest(source);
                if (harvestResult !== OK) { // If not successfully harvested
                    if (harvestResult === ERR_NOT_IN_RANGE) { // If out of range, move
                        creep.say('🚶 ToSource');
                        const moveResult = creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                        creep.say(`M:${moveResult}`);
                    } else { // In range, but cannot harvest (e.g., source empty, ERR_NOT_ENOUGH_RESOURCES)
                        creep.say(`H:${harvestResult}`); // Display the error (e.g., H:-6)
                        // Creep is in range, but the source is empty or other non-movement error.
                        // Clear sourceId to trigger re-assignment or fallback tasks.
                        creep.memory.sourceId = undefined; // Clear sourceId to trigger re-assignment
                        creep.say('🔄 Re-eval'); // Indicate it's re-evaluating
                    }
                } else {
                    creep.say(`H:${harvestResult}`); // Harvested OK
                }
            } else { // Source was null/undefined, meaning sourceId is invalid or source is gone.
                creep.say('❓ NoSource');
                const allSources = creep.room.find(FIND_SOURCES);
                // Determine target harvesters per source based on RCL, consistent with main.ts
                const targetHarvestersPerSource = creep.room.controller && creep.room.controller.level < 4 ? 2 : 1;

                let bestSource: Source | null = null;
                let minHarvesters = Infinity;

                for (const s of allSources) {
                    const harvestersAssignedToSource = _.filter(Game.creeps, (c) => 
                        c.memory.role === 'harvester' && c.memory.sourceId === s.id && c.room.name === creep.room.name
                    ).length;

                    if (harvestersAssignedToSource < targetHarvestersPerSource) {
                        if (harvestersAssignedToSource < minHarvesters) {
                            minHarvesters = harvestersAssignedToSource;
                            bestSource = s;
                        }
                    }
                }

                if (bestSource) {
                    creep.memory.sourceId = bestSource.id;
                    creep.say(`🔄 To ${bestSource.id.substring(bestSource.id.length - 4)}`);
                } else {
                    creep.say('💤 Idle');
                    // All sources are full or assigned. Harvester should now assist with other tasks.
                    if (!taskBuild.run(creep)) {
                        taskUpgrade.run(creep);
                    }
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
                    const transferResult = creep.transfer(container, RESOURCE_ENERGY);
                    if (transferResult === ERR_NOT_IN_RANGE) {
                        creep.say('🚶 ToCont');
                        const moveResult = creep.moveTo(container);
                        creep.say(`M:${moveResult}`);
                    } else {
                        creep.say(`T:${transferResult}`);
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
                    const transferResult = creep.transfer(target, RESOURCE_ENERGY);
                    if (transferResult === ERR_NOT_IN_RANGE) {
                        creep.say('🚶 ToSpawn');
                        const moveResult = creep.moveTo(target);
                        creep.say(`M:${moveResult}`);
                    } else {
                        creep.say(`T:${transferResult}`);
                    }
                }
            }
        }
    }
};

export default roleHarvester;

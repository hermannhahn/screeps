import _ from 'lodash';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';

// Helper function to check if a source is safe from hostile structures and creeps
function isSourceSafe(source: Source, hostileStructures: Structure[], hostileCreeps: Creep[]): boolean {
    const range = 10; // User specified range

    // Check for hostile structures
    for (const hostileStructure of hostileStructures) {
        if (source.pos.getRangeTo(hostileStructure) <= range) {
            return false; // Hostile structure too close
        }
    }

    // Check for hostile creeps
    for (const hostileCreep of hostileCreeps) {
        if (source.pos.getRangeTo(hostileCreep) <= range) {
            return false; // Hostile creep too close
        }
    }

    return true; // No hostile structures or creeps nearby
}

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
                const harvestResult = creep.harvest(source);
                if (harvestResult !== OK) { // If not successfully harvested
                    if (harvestResult === ERR_NOT_IN_RANGE) { // If out of range, move
                        const moveResult = creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                    } else { // In range, but cannot harvest (e.g., source empty, ERR_NOT_ENOUGH_RESOURCES)
                        // Creep is in range, but the source is empty or other non-movement error.
                        // Harvester will wait for source to regenerate.
                    }
                } else {
                }
            } else { // Source was null/undefined, meaning sourceId is invalid or source is gone.
                const allSourcesInRoom = creep.room.find(FIND_SOURCES);
                const hostileStructuresInRoom = creep.room.find(FIND_HOSTILE_STRUCTURES); // Find hostile structures in this room
                const hostileCreepsInRoom = creep.room.find(FIND_HOSTILE_CREEPS); // Find hostile creeps in this room
                const safeSources = allSourcesInRoom.filter(source => isSourceSafe(source, hostileStructuresInRoom, hostileCreepsInRoom));
                
                // Determine target harvesters per source based on RCL, consistent with main.ts
                const targetHarvestersPerSource = creep.room.controller && creep.room.controller.level < 4 ? 2 : 1;

                let bestSource: Source | null = null;
                let minHarvesters = Infinity;

                for (const s of safeSources) { // Iterate over safeSources
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
                } else {
                    // All sources are full or assigned. Harvester should now assist with other tasks.
                    if (!taskBuild.run(creep)) {
                        taskUpgrade.run(creep);
                    }
                }
            }
        } else { // Creep está cheio de energia
            const suppliersInRoom = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === creep.room.name);

            if (suppliersInRoom.length > 0) {
                // Logic for when suppliers ARE present (current behavior: container near source or drop)
                const assignedSource = Game.getObjectById(creep.memory.sourceId as Id<Source>);
                let depositTarget: StructureContainer | null = null; 

                // Prioridade: Containers (próximos à fonte, até 3 tiles)
                if (assignedSource) {
                    const containersInRange = assignedSource.pos.findInRange(FIND_STRUCTURES, 3, { 
                        filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }) as StructureContainer[];

                    if (containersInRange.length > 0) {
                        depositTarget = containersInRange.sort((a, b) => 
                            creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b) ||
                            a.store.getFreeCapacity(RESOURCE_ENERGY) - b.store.getFreeCapacity(RESOURCE_ENERGY)
                        )[0];
                    }
                }

                if (depositTarget) {
                    if (creep.transfer(depositTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(depositTarget, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                } else {
                    creep.drop(RESOURCE_ENERGY);
                }
            } else {
                // Logic for when NO suppliers are present (deliver to spawn, then extensions)
                let depositTarget: StructureSpawn | StructureExtension | null = null;

                // Prioridade 1: Spawn
                depositTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_SPAWN && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }) as StructureSpawn | null;

                // Prioridade 2: Extensions
                if (!depositTarget) {
                    depositTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }) as StructureExtension | null;
                }

                if (depositTarget) {
                    if (creep.transfer(depositTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(depositTarget, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                } else {
                    // If no spawn or extension needs energy, drop it
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    }
};

export default roleHarvester;

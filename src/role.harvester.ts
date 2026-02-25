import _ from 'lodash';
import taskBuild from './task.build';
import taskUpgrade from './task.upgrade';
import taskDeliver from './task.deliver';

// Helper function to check if a source is safe from hostile structures and creeps
function isSourceSafe(source: Source, hostileStructures: Structure[], hostileCreeps: Creep[]): boolean {
    const range = 10;
    for (const hostileStructure of hostileStructures) {
        if (source.pos.getRangeTo(hostileStructure) <= range) return false;
    }
    for (const hostileCreep of hostileCreeps) {
        if (source.pos.getRangeTo(hostileCreep) <= range) return false;
    }
    return true;
}

const roleHarvester = {
    run: function(creep: Creep) {
        const hostileCreepsInRoom = creep.room.find(FIND_HOSTILE_CREEPS);
        const extensions = creep.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const hasEnoughExtensions = extensions.length >= 5;

        // Flee logic
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
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                const safeSources = creep.room.find(FIND_SOURCES).filter(s => isSourceSafe(s, creep.room.find(FIND_HOSTILE_STRUCTURES), hostileCreepsInRoom));
                const targetHarvestersPerSource = creep.room.controller && creep.room.controller.level < 4 ? 2 : 1;

                let bestSource: Source | null = null;
                let minHarvesters = Infinity;

                for (const s of safeSources) {
                    const assigned = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.memory.sourceId === s.id).length;
                    if (assigned < targetHarvestersPerSource && assigned < minHarvesters) {
                        minHarvesters = assigned;
                        bestSource = s;
                    }
                }

                if (bestSource) {
                    creep.memory.sourceId = bestSource.id;
                    creep.say('⛏️');
                }
                else if (!taskBuild.run(creep)) taskUpgrade.run(creep);
            }
        } else {
            const suppliersInRoom = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === creep.room.name);

            if (suppliersInRoom.length > 0) {
                // When suppliers are present, fill nearby containers or drop
                const assignedSource = Game.getObjectById(creep.memory.sourceId as Id<Source>);
                let depositTarget: StructureContainer | null = null; 

                if (assignedSource) {
                    const containersInRange = assignedSource.pos.findInRange(FIND_STRUCTURES, 3, { 
                        filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }) as StructureContainer[];

                    if (containersInRange.length > 0) {
                        depositTarget = _.minBy(containersInRange, c => creep.pos.getRangeTo(c)) || null;
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
                // EMERGENCY: No suppliers, harvester must deliver energy
                if (!taskDeliver.run(creep)) {
                    if (!taskBuild.run(creep)) {
                        taskUpgrade.run(creep);
                    }
                }
            }
        }
    }
};

export default roleHarvester;

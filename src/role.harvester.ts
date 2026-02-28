import _ from 'lodash';
import taskDeliver from './task.deliver';
import { cacheUtils } from './utils.cache';

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
        const hostileCreepsInRoom = cacheUtils.getHostiles(creep.room);
        const extensions = cacheUtils.findInRoom(creep.room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_EXTENSION, 10);
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
                        roomCallback: (roomName: string) => { // Type 'string'
                            let room = Game.rooms[roomName];
                            if (!room) return new PathFinder.CostMatrix();
                            
                            const cm = new PathFinder.CostMatrix();
                            cacheUtils.getHostiles(room).forEach((c: Creep) => cm.set(c.pos.x, c.pos.y, 255)); // Type 'Creep'
                            cacheUtils.findInRoom(room, FIND_STRUCTURES, undefined, 10).forEach((struct: Structure) => { // Type 'Structure'
                                if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_RAMPART) {
                                    cm.set(struct.pos.x, struct.pos.y, 255);
                                }
                            });
                            return cm;
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
                const hostileStructures = cacheUtils.findInRoom(creep.room, FIND_HOSTILE_STRUCTURES, undefined, 10);
                const safeSources = cacheUtils.getSources(creep.room).filter((s: Source) => isSourceSafe(s, hostileStructures, hostileCreepsInRoom)); // Type 'Source'
                const targetHarvestersPerSource = creep.room.controller && creep.room.controller.level < 4 ? 2 : 1;

                let bestSource: Source | null = null;
                let minHarvesters = Infinity;

                for (const s of safeSources) {
                    const assigned = _.filter(Game.creeps, (c: Creep) => c.memory.role === 'harvester' && c.memory.sourceId === s.id).length; // Type 'Creep'
                    if (assigned < targetHarvestersPerSource && assigned < minHarvesters) {
                        minHarvesters = assigned;
                        bestSource = s;
                    }
                }

                if (bestSource) {
                    creep.memory.sourceId = bestSource.id;
                    creep.say('⛏️');
                }
            }
        } else {
            const suppliersInRoom = _.filter(Game.creeps, (c: Creep) => c.memory.role === 'supplier' && c.room.name === creep.room.name); // Type 'Creep'

            if (suppliersInRoom.length > 0) {
                // Prioridade 1: Links em range 3
                const linksInRange = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
                    filter: (s: StructureLink) => s.structureType === STRUCTURE_LINK && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 // Type 'StructureLink'
                }) as StructureLink[];

                if (linksInRange.length > 0) {
                    const link = _.minBy(linksInRange, l => creep.pos.getRangeTo(l));
                    if (link) {
                        if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(link, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                        return;
                    }
                }

                // Prioridade 2: Containers perto da fonte atribuída
                const assignedSource = Game.getObjectById(creep.memory.sourceId as Id<Source>);
                let depositTarget: StructureContainer | null = null; 

                if (assignedSource) {
                    const containersInRange = assignedSource.pos.findInRange(FIND_STRUCTURES, 3, { 
                        filter: (s: StructureContainer) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 // Type 'StructureContainer'
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
                taskDeliver.run(creep);
            }
        }
    }
};

export default roleHarvester;

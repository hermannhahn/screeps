// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    // --- ESCOLHA DO SOURCE ---
    if (!creep.memory.sourceId) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        if (safeSources.length > 0) {
            const harvesters = _.filter(Game.creeps, (c) => c.room.name === room.name && c.memory.role === 'harvester' && c.name !== creep.name);
            for (const source of safeSources) {
                const assignedCount = _.filter(harvesters, (h) => h.memory.sourceId === source.id).length;
                if (assignedCount < 2) {
                    creep.memory.sourceId = source.id;
                    creep.say('⛏️', true); // Diz apenas uma vez ao definir o alvo
                    break;
                }
            }
        }
    }

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) {
        delete creep.memory.sourceId;
        return;
    }

    // --- TRABALHO ---
    if (creep.store.getFreeCapacity() > 0) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    } else {
        const suppliers = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name && c.memory.role === 'supplier' && !c.spawning);

        if (suppliers.length === 0) {
            const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s: AnyStructure) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }) as AnyStructure;
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.controller!);
                }
            }
        } else {
            const link = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
                filter: (s) => s.structureType === STRUCTURE_LINK && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            })[0];

            if (link) {
                if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(link);
                }
            } else {
                const container = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })[0];

                if (container) {
                    if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(container);
                    }
                } else {
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    }
}

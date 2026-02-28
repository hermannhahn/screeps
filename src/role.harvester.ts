// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    if (creep.memory.sourceId) {
        const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
        if (!source) {
            console.log(`${creep.name}: Source ${creep.memory.sourceId} não encontrado. Resetando.`);
            delete creep.memory.sourceId;
        }
    }

    if (!creep.memory.sourceId) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        if (safeSources.length > 0) {
            const harvesters = _.filter(Game.creeps, (c) => c.room.name === room.name && c.memory.role === 'harvester' && c.name !== creep.name);
            for (const source of safeSources) {
                const assignedCount = _.filter(harvesters, (h) => h.memory.sourceId === source.id).length;
                if (assignedCount < 2) {
                    creep.memory.sourceId = source.id;
                    console.log(`${creep.name}: NOVA ATRIBUIÇÃO -> ${source.id}`);
                    break;
                }
            }
        }
    }

    if (!creep.memory.sourceId) return;

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) return;

    const isFull = creep.store.getFreeCapacity() === 0;
    
    if (!isFull) {
        const result = creep.harvest(source);
        if (result === ERR_NOT_IN_RANGE || result === OK || result === ERR_NOT_ENOUGH_RESOURCES) {
            if (creep.pos.getRangeTo(source) > 1) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    } else {
        const suppliers = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name && c.memory.role === 'supplier');
        let target: AnyStructure | null = null;

        if (suppliers.length === 0) {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s: AnyStructure) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }) as AnyStructure;
        } else {
            // Filtrar apenas Link ou Container
            const potentialTargets = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s: AnyStructure) => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (potentialTargets.length > 0) target = potentialTargets[0] as AnyStructure;
        }

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            if (suppliers.length > 0) {
                creep.drop(RESOURCE_ENERGY);
            } else {
                if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.controller!);
                }
            }
        }
    }
}

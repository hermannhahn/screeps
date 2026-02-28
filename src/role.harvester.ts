// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    // Escolha de source persistente
    if (!creep.memory.sourceId) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        console.log(`${creep.name}: Escolhendo source. Seguros: ${safeSources.length}/${sources.length}`);

        if (safeSources.length > 0) {
            const harvesters = _.filter(Game.creeps, (c) => c.room.name === room.name && c.memory.role === 'harvester' && c.name !== creep.name);
            for (const source of safeSources) {
                const assignedCount = _.filter(harvesters, (h) => h.memory.sourceId === source.id).length;
                if (assignedCount < 2) {
                    creep.memory.sourceId = source.id;
                    console.log(`${creep.name}: Atribuído ao source ${source.id}`);
                    break;
                }
            }
        } else {
            console.log(`${creep.name}: AVISO - Nenhum source seguro encontrado!`);
        }
    }

    if (!creep.memory.sourceId) return;

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) {
        delete creep.memory.sourceId;
        return;
    }

    // --- Trabalho ---
    if (creep.store.getFreeCapacity() > 0) {
        const harvestResult = creep.harvest(source);
        if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    } else {
        const suppliers = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name && c.memory.role === 'supplier');

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
            const potentialTargets = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s: AnyStructure) => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            
            if (potentialTargets.length > 0) {
                const target = potentialTargets[0] as AnyStructure;
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                creep.drop(RESOURCE_ENERGY);
            }
        }
    }
}

// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    if (!creep.memory.sourceId) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        console.log(`${creep.name}: Escolhendo source. Disponíveis: ${safeSources.length}`);

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
        }
    }

    if (!creep.memory.sourceId) return;

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) {
        delete creep.memory.sourceId;
        return;
    }

    if (creep.store.getFreeCapacity() > 0) {
        const res = creep.harvest(source);
        if (res === ERR_NOT_IN_RANGE) {
            console.log(`${creep.name}: Indo para source ${source.pos}`);
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (res === OK) {
            console.log(`${creep.name}: Harvestando...`);
        } else {
            console.log(`${creep.name}: Erro ao harvestar: ${res}`);
        }
    } else {
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s: AnyStructure) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStructure;

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                console.log(`${creep.name}: Indo depositar no ${target.structureType}`);
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            console.log(`${creep.name}: Nada para depositar, aguardando.`);
        }
    }
}

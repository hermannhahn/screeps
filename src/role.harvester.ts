// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;
    // console.log(`${creep.name}: Início do processamento.`);

    // --- ESCOLHA DO SOURCE ---
    if (!creep.memory.sourceId) {
        console.log(`${creep.name}: Sem sourceId na memória. Procurando...`);
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        if (safeSources.length > 0) {
            const harvesters = _.filter(Game.creeps, (c) => c.room.name === room.name && c.memory.role === 'harvester' && c.name !== creep.name);
            for (const source of safeSources) {
                const assignedCount = _.filter(harvesters, (h) => h.memory.sourceId === source.id).length;
                if (assignedCount < 2) {
                    creep.memory.sourceId = source.id;
                    console.log(`${creep.name}: Atribuído ao source ${source.id} em ${source.pos}`);
                    break;
                }
            }
        } else {
            console.log(`${creep.name}: ERRO - Nenhum source seguro encontrado!`);
        }
    }

    // Validação final do alvo
    if (!creep.memory.sourceId) {
        console.log(`${creep.name}: Saindo - sourceId continua indefinido.`);
        return;
    }

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) {
        console.log(`${creep.name}: Saindo - Alvo ${creep.memory.sourceId} é inválido ou está fora de vista. Resetando memória.`);
        delete creep.memory.sourceId;
        return;
    }

    // --- TRABALHO ---
    if (creep.store.getFreeCapacity() > 0) {
        const res = creep.harvest(source);
        if (res === ERR_NOT_IN_RANGE) {
            console.log(`${creep.name}: Movendo para source em ${source.pos}`);
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (res === OK) {
            // console.log(`${creep.name}: Harvestando...`);
        } else {
            console.log(`${creep.name}: Erro ao colher: ${res}`);
        }
    } else {
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s: AnyStructure) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStructure;

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                console.log(`${creep.name}: Movendo para entrega em ${target.structureType}`);
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            console.log(`${creep.name}: Sem destino para entrega. Fazendo upgrade.`);
            if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller!);
            }
        }
    }
}

// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    // --- ESCOLHA PERSISTENTE DO SOURCE ---
    if (!creep.memory.sourceId) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        
        if (safeSources.length > 0) {
            const harvesters = _.filter(Game.creeps, (c) => c.room.name === room.name && c.memory.role === 'harvester');
            
            for (const source of safeSources) {
                // Contar quantos harvesters já estão atribuídos a este source (incluindo os que estão spawnando)
                const assignedCount = _.filter(harvesters, (h) => h.memory.sourceId === source.id).length;
                if (assignedCount < 2) {
                    creep.memory.sourceId = source.id;
                    console.log(`${creep.name}: Atribuído ao source ${source.id} em ${source.pos}`);
                    break;
                }
            }
        } else {
            console.log(`${creep.name}: Nenhum source SEGURO encontrado na sala!`);
        }
    }

    // Se após a tentativa ainda não tiver sourceId, o creep para e avisa
    if (!creep.memory.sourceId) {
        // console.log(`${creep.name}: Aguardando atribuição de source livre/seguro...`);
        return;
    }

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) {
        console.log(`${creep.name}: Source atribuído (${creep.memory.sourceId}) não foi encontrado! Resetando...`);
        delete creep.memory.sourceId;
        return;
    }

    // --- LÓGICA DE TRABALHO ---
    if (creep.store.getFreeCapacity() > 0) {
        // Coletar
        const harvestResult = creep.harvest(source);
        if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (harvestResult !== OK) {
            // Se houver outro erro (ex: source vazio), apenas logar se for crítico
            // console.log(`${creep.name}: Erro ao harvestar: ${harvestResult}`);
        }
    } else {
        // Depositar
        const room = creep.room;
        const suppliers = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name && c.memory.role === 'supplier');

        if (suppliers.length === 0) {
            // Sem suppliers: Spawn/Extensions
            const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                // Controller upgrade como fallback
                if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.controller!);
                }
            }
        } else {
            // Com suppliers: Link > Container > Drop
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
                    // Drop perto da source (o supplier pegará)
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    }
}

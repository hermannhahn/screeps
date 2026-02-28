// src/role.harvester.ts
import { isSourceSafe } from './tools';

export function runHarvester(creep: Creep): void {
    const room = creep.room;

    // --- 1. VALIDAÇÃO DE MEMÓRIA ---
    if (creep.memory.sourceId) {
        const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
        if (!source) {
            console.log(`${creep.name}: Source ${creep.memory.sourceId} não encontrado. Resetando.`);
            delete creep.memory.sourceId;
        }
    }

    // --- 2. ATRIBUIÇÃO ---
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

    if (!creep.memory.sourceId) {
        console.log(`${creep.name}: Sem source disponível/seguro.`);
        return;
    }

    const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
    if (!source) return;

    // --- 3. LOGICA DE TRABALHO ---
    const isFull = creep.store.getFreeCapacity() === 0;
    
    if (!isFull) {
        // Tentar colher
        const result = creep.harvest(source);
        console.log(`${creep.name}: Harvest Result=${result}, Pos=${creep.pos}`);

        if (result === ERR_NOT_IN_RANGE || result === OK || result === ERR_NOT_ENOUGH_RESOURCES) {
            // Se não estiver perto, move. Se estiver perto mas vazio, fica perto.
            if (creep.pos.getRangeTo(source) > 1) {
                const moveResult = creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                console.log(`${creep.name}: Moving to Source, Result=${moveResult}`);
            }
        }
    } else {
        // Tentar depositar
        const suppliers = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name && c.memory.role === 'supplier');
        let target: AnyStructure | null = null;

        if (suppliers.length === 0) {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
        } else {
            // Com suppliers: Link ou Container
            target = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
                filter: (s) => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            })[0] as AnyStructure;
        }

        if (target) {
            const transferResult = creep.transfer(target, RESOURCE_ENERGY);
            console.log(`${creep.name}: Transfer Result=${transferResult} to ${target.structureType}`);
            if (transferResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            // Se estiver cheio e sem alvo, upgrade ou drop
            if (suppliers.length > 0) {
                console.log(`${creep.name}: Dropping energy (Suppliers alive)`);
                creep.drop(RESOURCE_ENERGY);
            } else {
                console.log(`${creep.name}: Upgrading as fallback`);
                if (creep.upgradeController(room.controller!) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.controller!);
                }
            }
        }
    }
}

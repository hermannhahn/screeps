// src/main.ts
console.log("--- GEMINI DEPLOY: v5 (Stage 1 Diamond & Built Check) ---");

import { planStructures } from './manager.planner';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';

export const loop = function () {
    // Limpeza de memória
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    const room = Object.values(Game.rooms)[0];
    if (!room) return;

    // Planner
    planStructures(room);

    // Sincronizar status das construções planejadas com o mapa
    if (Memory.planning && Memory.planning.plannedStructures) {
        for (const p of Memory.planning.plannedStructures) {
            if (p.status === 'built') continue;

            const pos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
            const structures = pos.lookFor(LOOK_STRUCTURES);
            const isBuilt = structures.some(s => s.structureType === p.structureType);

            if (isBuilt) {
                p.status = 'built';
                console.log(`Main: Structure ${p.structureType} built at ${p.pos.x},${p.pos.y}`);
                continue;
            }

            const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            const hasSite = sites.some(s => s.structureType === p.structureType);

            if (hasSite) {
                p.status = 'building';
            } else if (p.status === 'building') {
                // Se estava building e não tem site nem estrutura, algo deu errado (ou foi destruído)
                p.status = 'to_build';
            }
        }
    }

    // Criar Construction Sites pendentes
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            const result = room.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
            if (result === OK) {
                p.status = 'building';
                console.log(`Main: Created CS for ${p.structureType} at ${p.pos.x},${p.pos.y}`);
            }
        }
    }

    // Spawner básico
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning && room.energyAvailable >= 200) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        
        if (harvesters.length < 2) {
            spawn.spawnCreep([WORK, CARRY, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
        } else {
            const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');
            if (builders.length < 2 && room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
                spawn.spawnCreep([WORK, CARRY, MOVE], 'Builder' + Game.time, { memory: { role: 'builder' } });
            }
        }
    }

    // Rodar creeps
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') runHarvester(creep);
        if (creep.memory.role === 'builder') runBuilder(creep);
        if (creep.memory.role === 'supplier') runSupplier(creep);
    }
}

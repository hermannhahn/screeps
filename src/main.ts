// src/main.ts
console.log("--- GEMINI DEPLOY TEST: Código Atualizado v1 ---");

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

    // Processar construções planejadas
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter(p => p.status === 'to_build');
        for (const p of toBuild) {
            if (room.createConstructionSite(p.pos.x, p.pos.y, p.structureType) === OK) {
                p.status = 'building';
                console.log(`Main: Created CS for ${p.structureType} at ${p.pos.x},${p.pos.y}`);
            }
        }
    }

    // Spawner básico
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning && room.energyAvailable >= 200) {
        const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
        if (harvesters.length < 2) {
            spawn.spawnCreep([WORK, CARRY, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
        } else {
            const builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
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

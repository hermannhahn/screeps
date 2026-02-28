// src/main.ts
import { planStructures } from './manager.planner';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';
import { runUpgrader } from './role.upgrader';

console.log("--- GEMINI DEPLOY: v17 (Body Parts Fix) ---");

export const loop = function () {
    if (Game.time % 1000 === 0) console.log(`--- TICK: ${Game.time} ---`);

    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    let room = Object.values(Game.rooms)[0];
    if (!room) {
        const spawns = Object.values(Game.spawns);
        if (spawns.length > 0) room = spawns[0].room;
    }
    if (!room) return;

    planStructures(room);

    // Sincronizar status das construções
    if (Memory.planning && Memory.planning.plannedStructures) {
        for (const p of Memory.planning.plannedStructures) {
            if (p.status === 'built') continue;
            const pos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
            const isBuilt = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === p.structureType);
            if (isBuilt) {
                p.status = 'built';
                continue;
            }
            p.status = pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0 ? 'building' : 'to_build';
        }
    }

    // Criar Construction Sites pendentes
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            room.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
        }
    }

    // --- LOGICA DE SPAWN (Corpos corrigidos) ---
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        
        // Harvester agora com CARRY
        if (harvesters.length < 2 && room.energyAvailable >= 200) {
            const res = spawn.spawnCreep([WORK, CARRY, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
            if (res === OK) console.log("Main: Spawning Harvester (Fixed Body)");
        } else {
            const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');
            if (builders.length < 2 && room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 && room.energyAvailable >= 200) {
                spawn.spawnCreep([WORK, CARRY, MOVE], 'Builder' + Game.time, { memory: { role: 'builder' } });
            }
        }
    }

    // Rodar creeps
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.spawning) continue;
        
        try {
            if (creep.memory.role === 'harvester') runHarvester(creep);
            else if (creep.memory.role === 'builder') runBuilder(creep);
            else if (creep.memory.role === 'supplier') runSupplier(creep);
            else if (creep.memory.role === 'upgrader') runUpgrader(creep);
        } catch (e) {
            console.log(`Error running creep ${creep.name}: ${e}`);
        }
    }
}

// src/main.ts
import { planStructures } from './manager.planner';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';
import { runUpgrader } from './role.upgrader';

console.log("CRITICAL: SCRIPT LOADED v16");

export const loop = function () {
    console.log(`--- LOOP START - Tick: ${Game.time} ---`);

    // Limpeza de memória
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log(`Memory: Cleared dead creep ${name}`);
        }
    }

    // Tentar obter a sala de várias formas
    let room = Object.values(Game.rooms)[0];
    if (!room) {
        // Se não encontrar por rooms, tenta pelo spawn
        const spawns = Object.values(Game.spawns);
        if (spawns.length > 0) room = spawns[0].room;
    }

    if (!room) {
        console.log("Main: ERROR - No room found!");
        return;
    }
    console.log(`Main: Operating in room ${room.name}`);

    // Planner
    try {
        planStructures(room);
    } catch (e) {
        console.log(`Main: Error in Planner: ${e}`);
    }

    // Sincronizar status das construções
    if (Memory.planning && Memory.planning.plannedStructures) {
        for (const p of Memory.planning.plannedStructures) {
            if (p.status === 'built') continue;
            const pos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
            const isBuilt = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === p.structureType);
            if (isBuilt) {
                p.status = 'built';
                console.log(`Main: Structure ${p.structureType} built at ${p.pos.x},${p.pos.y}`);
                continue;
            }
            p.status = pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0 ? 'building' : 'to_build';
        }
    }

    // Criar Construction Sites pendentes
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            const res = room.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
            if (res === OK) console.log(`Main: Created CS for ${p.structureType}`);
        }
    }

    // Spawner
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        
        if (harvesters.length < 2 && room.energyAvailable >= 250) {
            const res = spawn.spawnCreep([WORK, WORK, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
            if (res === OK) console.log("Main: Spawning Harvester");
        }
    }

    // Rodar creeps
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.spawning) continue;
        
        console.log(`Running ${creep.name} (${creep.memory.role})`);
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

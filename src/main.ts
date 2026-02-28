// src/main.ts
console.log("--- GEMINI DEPLOY: v6 (Spawning Priority & Role Refinement) ---");

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

    // --- SPANWER LOGIC (Priority: Harvester > Supplier > Builder) ---
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        const suppliers = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'supplier');
        const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');

        let spawned = false;

        // 1. Harvesters (Mínimo 2)
        if (harvesters.length < 2 && room.energyAvailable >= 250) {
            spawn.spawnCreep([WORK, WORK, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
            spawned = true;
        } 
        // 2. Suppliers (Mínimo 1, apenas se houver harvesters e energia no spawn/containers)
        else if (!spawned && suppliers.length < 1 && harvesters.length > 0 && room.energyAvailable >= 200) {
            spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], 'Supplier' + Game.time, { memory: { role: 'supplier' } });
            spawned = true;
        }
        // 3. Builders (Mínimo 2, se houver CS)
        else if (!spawned && builders.length < 2 && room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 && room.energyAvailable >= 250) {
            spawn.spawnCreep([WORK, CARRY, MOVE, MOVE], 'Builder' + Game.time, { memory: { role: 'builder' } });
            spawned = true;
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

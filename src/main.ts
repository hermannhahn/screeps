// src/main.ts
import { planStructures } from './manager.planner';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';

console.log("--- GEMINI DEPLOY: v9 (Dynamic Spawning Logic) ---");

export const loop = function () {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    const room = Object.values(Game.rooms)[0];
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

    // --- LOGICA DE SPAWN DINAMICA ---
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        const suppliers = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'supplier');
        const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');

        const sources = room.find(FIND_SOURCES);
        const rcl = room.controller ? room.controller.level : 1;

        // 1. Determinar meta de Harvesters
        // 2 por source se work < 5, senão 1 por source.
        // Verificamos o corpo do primeiro harvester vivo como referência
        const firstHarvester = harvesters[0];
        const workCount = firstHarvester ? _.filter(firstHarvester.body, (p) => p.type === WORK).length : 0;
        const targetHarvesters = (workCount < 5) ? sources.length * 2 : sources.length;

        // 2. Determinar meta de Suppliers
        // 2 suppliers por harvester vivo
        const targetSuppliers = harvesters.length * 2;

        // 3. Determinar meta de Builders
        // 2 se RCL <= 2, senão 1. Apenas se houver CS.
        const hasCS = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0;
        const targetBuilders = hasCS ? (rcl <= 2 ? 2 : 1) : 0;

        // Execução do Spawn (Prioridade: Harvester > Supplier > Builder)
        if (harvesters.length < targetHarvesters && room.energyAvailable >= 250) {
            spawn.spawnCreep([WORK, WORK, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester' } });
        } 
        else if (suppliers.length < targetSuppliers && room.energyAvailable >= 200) {
            spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], 'Supplier' + Game.time, { memory: { role: 'supplier' } });
        } 
        else if (builders.length < targetBuilders && room.energyAvailable >= 250) {
            spawn.spawnCreep([WORK, CARRY, MOVE, MOVE], 'Builder' + Game.time, { memory: { role: 'builder' } });
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

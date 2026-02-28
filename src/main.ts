// src/main.ts
import { planStructures } from './manager.planner';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';
import { runUpgrader } from './role.upgrader';
import { isSourceSafe, generateBody } from './tools';

export const loop = function () {
    // console.log(`--- TICK ${Game.time} ---`);

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

    // 1. Sincronizar
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

    // 2. Planner
    try {
        planStructures(room);
    } catch (e) {
        console.log("Main Error (Planner): " + e);
    }

    // 3. CS
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            const res = room.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
            if (res === OK) p.status = 'building';
        }
    }

    // 4. Spawn
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && !spawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        const suppliers = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'supplier');
        const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');
        const upgraders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'upgrader');

        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        const rcl = room.controller ? room.controller.level : 1;
        const hasCS = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0;

        const firstHarvester = harvesters[0];
        const workCount = firstHarvester ? _.filter(firstHarvester.body, (p) => p.type === WORK).length : 0;
        const targetHarvesters = (workCount < 5) ? safeSources.length * 2 : safeSources.length;
        const targetSuppliers = Math.max(1, harvesters.length + 1);
        const targetBuilders = hasCS ? (rcl <= 2 ? 2 : 1) : 0;
        const targetUpgraders = (rcl <= 3) ? 2 : 1;

        const energyForBody = (harvesters.length === 0) ? room.energyAvailable : room.energyCapacityAvailable;

        let roleToSpawn: string | null = null;
        if (harvesters.length < safeSources.length) roleToSpawn = 'harvester';
        else if (suppliers.length < 1) roleToSpawn = 'supplier';
        else if (upgraders.length < 1) roleToSpawn = 'upgrader';
        else if (harvesters.length < targetHarvesters) roleToSpawn = 'harvester';
        else if (builders.length < targetBuilders) roleToSpawn = 'builder';
        else if (suppliers.length < targetSuppliers) roleToSpawn = 'supplier';
        else if (upgraders.length < targetUpgraders) roleToSpawn = 'upgrader';

        if (roleToSpawn) {
            const body = generateBody(roleToSpawn, energyForBody);
            let cost = 0;
            for (const part of body) cost += BODYPART_COST[part];
            if (room.energyAvailable >= cost) {
                spawn.spawnCreep(body, roleToSpawn.charAt(0).toUpperCase() + roleToSpawn.slice(1) + Game.time, { memory: { role: roleToSpawn } });
            }
        }
    }

    // 5. Creeps
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.spawning) continue;
        if (creep.memory.role === 'harvester') runHarvester(creep);
        else if (creep.memory.role === 'builder') runBuilder(creep);
        else if (creep.memory.role === 'supplier') runSupplier(creep);
        else if (creep.memory.role === 'upgrader') runUpgrader(creep);
    }
}

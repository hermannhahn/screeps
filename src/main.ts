// src/main.ts
import { planStructures } from './manager.planner';
import { manageRemoteMining, getRemoteSpawnRequest } from './manager.remote';
import { runHarvester } from './role.harvester';
import { runSupplier } from './role.supplier';
import { runBuilder } from './role.builder';
import { runUpgrader } from './role.upgrader';
import { runScout } from './role.scout';
import { runReserver } from './role.reserver';
import { runRemoteHarvester } from './role.remoteHarvester';
import { runRemoteCarrier } from './role.remoteCarrier';
import { isSourceSafe, generateBody } from './tools';

export const loop = function () {
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

    // --- 1. SINCRONIZAÇÃO DE STATUS (Com Verificação de Visibilidade) ---
    if (Memory.planning && Memory.planning.plannedStructures) {
        for (const p of Memory.planning.plannedStructures) {
            if (p.status === 'built') continue;

            // Só sincroniza se tivermos visibilidade da sala
            const targetRoom = Game.rooms[p.pos.roomName];
            if (targetRoom) {
                const pos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
                const isBuilt = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === p.structureType);
                if (isBuilt) {
                    p.status = 'built';
                    continue;
                }
                p.status = pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0 ? 'building' : 'to_build';
            }
        }
    }

    // --- 2. MANAGERS ---
    planStructures(room);
    manageRemoteMining(room);

    // --- 3. CRIAR CONSTRUCTION SITES (Apenas sala principal ou com visibilidade) ---
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            const targetRoom = Game.rooms[p.pos.roomName];
            if (targetRoom) {
                room.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
            }
        }
    }

    // --- 4. LOGICA DAS TORRES ---
    const towers = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }) as StructureTower[];
    for (const tower of towers) {
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) tower.attack(closestHostile);
        else {
            const damaged = tower.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART });
            if (damaged) tower.repair(damaged);
        }
    }

    // --- 5. LOGICA DE SPAWN DINAMICA ---
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

        const targetHarvesters = safeSources.length * 2;
        const targetSuppliers = Math.max(1, harvesters.length + 1);
        const targetBuilders = hasCS ? (rcl <= 2 ? 2 : 1) : 0;
        const targetUpgraders = (rcl <= 3) ? 2 : 1;

        const remoteRequest = getRemoteSpawnRequest(room);

        let roleToSpawn: string | null = null;
        let tRoom: string | undefined = undefined;

        if (harvesters.length < safeSources.length) roleToSpawn = 'harvester';
        else if (suppliers.length < 1) roleToSpawn = 'supplier';
        else if (upgraders.length < 1) roleToSpawn = 'upgrader';
        else if (remoteRequest && remoteRequest.role === 'scout') {
            roleToSpawn = 'scout';
            tRoom = remoteRequest.targetRoom;
        }
        else if (harvesters.length < targetHarvesters) roleToSpawn = 'harvester';
        else if (builders.length < targetBuilders) roleToSpawn = 'builder';
        else if (remoteRequest) {
            roleToSpawn = remoteRequest.role;
            tRoom = remoteRequest.targetRoom;
        }
        else if (suppliers.length < targetSuppliers) roleToSpawn = 'supplier';
        else if (upgraders.length < targetUpgraders) roleToSpawn = 'upgrader';

        if (roleToSpawn) {
            const energyLimit = (harvesters.length === 0) ? room.energyAvailable : room.energyCapacityAvailable;
            const body = generateBody(roleToSpawn, energyLimit);
            let cost = 0;
            for (const part of body) cost += BODYPART_COST[part];
            
            if (room.energyAvailable >= cost) {
                const name = roleToSpawn.charAt(0).toUpperCase() + roleToSpawn.slice(1) + Game.time;
                spawn.spawnCreep(body, name, { 
                    memory: { role: roleToSpawn, targetRoom: tRoom, homeRoom: room.name } 
                });
            }
        }
    }

    // --- 6. RODAR CREEPS ---
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.spawning) continue;
        switch (creep.memory.role) {
            case 'harvester': runHarvester(creep); break;
            case 'builder': runBuilder(creep); break;
            case 'supplier': runSupplier(creep); break;
            case 'upgrader': runUpgrader(creep); break;
            case 'scout': runScout(creep); break;
            case 'reserver': runReserver(creep); break;
            case 'remoteHarvester': runRemoteHarvester(creep); break;
            case 'remoteCarrier': runRemoteCarrier(creep); break;
        }
    }
}

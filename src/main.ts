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
import { runRepairer } from './role.repairer';
import { isSourceSafe, generateBody } from './tools';

export const loop = function () {
    // console.log(`--- LOOP TICK ${Game.time} ---`);

    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Identificação de sala resiliente
    const mainSpawn = Object.values(Game.spawns)[0];
    let room = mainSpawn ? mainSpawn.room : Object.values(Game.rooms)[0];
    
    if (!room) {
        console.log("Main: No visible rooms or spawns found.");
        return;
    }

    // --- 1. SINCRONIZAÇÃO DE STATUS ---
    if (Memory.planning && Memory.planning.plannedStructures) {
        for (const p of Memory.planning.plannedStructures) {
            if (p.status === 'built') continue;
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

    if (Game.time % 10 === 0) {
        console.log("DEBUG RemoteMining: " + JSON.stringify(Memory.remoteMining));
    }

    // --- 3. CRIAR CONSTRUCTION SITES ---
    if (Memory.planning && Memory.planning.plannedStructures) {
        const toBuild = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build');
        for (const p of toBuild) {
            const targetRoom = Game.rooms[p.pos.roomName];
            if (targetRoom) {
                const res = targetRoom.createConstructionSite(p.pos.x, p.pos.y, p.structureType as BuildableStructureConstant);
                if (res === OK) p.status = 'building';
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
    if (mainSpawn && !mainSpawn.spawning) {
        const creepsInRoom = _.filter(Game.creeps, (c: Creep) => c.room.name === room.name || c.memory.homeRoom === room.name);
        const harvesters = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'harvester');
        const suppliers = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'supplier');
        const builders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'builder');
        const upgraders = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'upgrader');
        const repairers = _.filter(creepsInRoom, (c: Creep) => c.memory.role === 'repairer');

        const sources = room.find(FIND_SOURCES);
        const safeSources = _.filter(sources, (s) => isSourceSafe(s));
        const rcl = room.controller ? room.controller.level : 1;
        
        // CORREÇÃO: Contagem global de Construction Sites para o Builder
        const globalCSCount = Object.keys(Game.constructionSites).length;
        const localCS = room.find(FIND_MY_CONSTRUCTION_SITES);

        const targetHarvesters = safeSources.length * 2;
        const targetSuppliers = Math.min(6, Math.max(2, harvesters.length)); // No mínimo 2 suppliers
        const targetBuilders = globalCSCount > 0 ? (rcl <= 3 ? 2 : 1) : 0;
        const targetRepairers = rcl >= 3 ? 1 : 0;
        const targetUpgraders = (rcl <= 3) ? 2 : 1;

        const remoteRequest = getRemoteSpawnRequest(room);
        if (remoteRequest && Game.time % 10 === 0) {
            console.log(`Main: Remote request found: ${remoteRequest.role} for ${remoteRequest.targetRoom}`);
        }

        let roleToSpawn: string | null = null;
        let tRoom: string | undefined = undefined;
        let sId: string | undefined = undefined;

        // PRIORIDADES REAJUSTADAS: Logística e Exploração barata primeiro
        if (harvesters.length < safeSources.length) roleToSpawn = 'harvester';
        else if (suppliers.length < 1) roleToSpawn = 'supplier';
        else if (suppliers.length < targetSuppliers / 2) roleToSpawn = 'supplier'; 
        
        // SCOUT TEM PRIORIDADE ALTA (é barato e garante visão)
        else if (remoteRequest && remoteRequest.role === 'scout') {
            roleToSpawn = 'scout';
            tRoom = remoteRequest.targetRoom;
        }
        
        else if (globalCSCount > 0 && builders.length < 1) roleToSpawn = 'builder'; 
        else if (repairers.length < targetRepairers) roleToSpawn = 'repairer';
        
        // REMOTE HARVESTER E CARRIER ESSENCIAIS
        else if (remoteRequest && (remoteRequest.role === 'remoteHarvester' || remoteRequest.role === 'remoteCarrier')) {
            roleToSpawn = remoteRequest.role;
            tRoom = remoteRequest.targetRoom;
            sId = remoteRequest.sourceId;
        }

        else if (upgraders.length < 1) roleToSpawn = 'upgrader';
        
        // RESERVERS E OUTROS REMOTOS DEPOIS
        else if (harvesters.length < targetHarvesters) roleToSpawn = 'harvester';
        else if (builders.length < targetBuilders) roleToSpawn = 'builder';
        
        // RESERVER (Só após o essencial)
        else if (remoteRequest && remoteRequest.role === 'reserver') {
            roleToSpawn = 'reserver';
            tRoom = remoteRequest.targetRoom;
        }

        else if (suppliers.length < targetSuppliers) roleToSpawn = 'supplier';
        else if (upgraders.length < targetUpgraders) roleToSpawn = 'upgrader';

        if (roleToSpawn) {
            console.log(`Main: Spawning ${roleToSpawn} for ${tRoom || 'home'}...`);
            let energyLimit = (harvesters.length === 0) ? room.energyAvailable : room.energyCapacityAvailable;
            
            // Flexibilidade para remotos: se for remoto e estiver travado por falta de energia, usa o que tem se for >= 300
            const isRemoteRole = ['remoteHarvester', 'remoteCarrier', 'reserver', 'scout'].includes(roleToSpawn);
            if (isRemoteRole && room.energyAvailable < energyLimit && room.energyAvailable >= 300) {
                energyLimit = room.energyAvailable;
            }

            const body = generateBody(roleToSpawn, energyLimit);
            let cost = 0;
            for (const part of body) cost += BODYPART_COST[part];
            
            if (room.energyAvailable >= cost) {
                const name = roleToSpawn.charAt(0).toUpperCase() + roleToSpawn.slice(1) + Game.time;
                const res = mainSpawn.spawnCreep(body, name, { 
                    memory: { role: roleToSpawn, targetRoom: tRoom, homeRoom: room.name, sourceId: sId as Id<Source> } 
                });
                if (res !== OK) console.log(`Main: Spawn error ${res} for ${roleToSpawn}`);
            } else {
                console.log(`Main: Waiting for energy (${room.energyAvailable}/${cost}) to spawn ${roleToSpawn}`);
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
            case 'repairer': runRepairer(creep); break;
        }
    }

    // MONITORAMENTO DE CPU (Obrigatório para validação autônoma)
    if (Game.time % 10 === 0) {
        console.log(`CPU: ${Game.cpu.getUsed().toFixed(2)} | Bucket: ${Game.cpu.bucket} | Creeps: ${Object.keys(Game.creeps).length}`);
    }
}

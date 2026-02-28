import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';
import roleGuard from './role.guard';
import roleArcher from './role.archer';
import roleRepairer from './role.repairer';
import roleScout from './role.scout';
import roleRemoteHarvester from './role.remoteHarvester';
import roleCarrier from './role.carrier';
import roleReserver from './role.reserver';
import managerPlanner from './manager.planner';
import managerSpawner from './manager.spawner';
import managerRemote from './manager.remote';
import managerMarket from './manager.market';
import { managerTower } from './manager.tower';
import Watcher from './watch-client';
import { cacheUtils } from './utils.cache';

const OBSTACLE_OBJECT_TYPES: string[] = [
    STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_WALL,
    STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_CONTROLLER,
    STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_OBSERVER,
    STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_LAB, STRUCTURE_TERMINAL,
    STRUCTURE_NUKER, STRUCTURE_FACTORY, STRUCTURE_POWER_BANK
];

RoomPosition.prototype.isWalkable = function(creepLooking?: Creep): boolean {
    const terrain = this.lookFor(LOOK_TERRAIN)[0];
    if (terrain === 'wall') return false;

    const structures = this.lookFor(LOOK_STRUCTURES);
    // Structures like roads and ramparts do not block movement or building other things (mostly)
    // But for BUILDING planning, we usually want to avoid anything that isn't a road or rampart.
    if (_.some(structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType))) {
        return false;
    }

    const constructionSites = this.lookFor(LOOK_CONSTRUCTION_SITES);
    if (_.some(constructionSites, (cs) => OBSTACLE_OBJECT_TYPES.includes(cs.structureType))) {
        return false;
    }
    
    // For general walkability, creeps block. For planning, they should not.
    // If creepLooking is provided, we check for other creeps.
    // If NOT provided (like in planner), we ignore creeps.
    if (creepLooking) {
        const creeps = this.lookFor(LOOK_CREEPS);
        if (creeps.length > 0 && creeps[0].id !== creepLooking.id) { 
            return false;
        }
    }

    return true;
};

RoomPosition.prototype.getAdjacentPositions = function(): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = this.x + dx;
            const y = this.y + dy;
            if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
                positions.push(new RoomPosition(x, y, this.roomName));
            }
        }
    }
    return positions;
};

RoomPosition.prototype.hasCreep = function(): boolean {
    return this.lookFor(LOOK_CREEPS).length > 0;
};

// Helper function to find an adjacent walkable spot for a given RoomPosition
RoomPosition.prototype.findAdjacentWalkableSpot = function(this: RoomPosition): RoomPosition | null {
    const room = Game.rooms[this.roomName];
    if (!room) return null;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip the center position

            const x = this.x + dx;
            const y = this.y + dy;

            // Check if within room bounds
            if (x < 0 || x > 49 || y < 0 || y > 49) continue;

            const pos = new RoomPosition(x, y, this.roomName);

            // Check if terrain is walkable
            if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

            // Check for existing structures. 
            // Most structures cannot be built on top of each other.
            // We only allow building if the spot is empty of non-road/non-rampart structures.
            const structures = pos.lookFor(LOOK_STRUCTURES);
            const hasBlockingStructure = _.some(structures, (s) => 
                s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART
            );
            if (hasBlockingStructure) continue;

            // Check for existing construction sites
            const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            const hasBlockingCS = _.some(constructionSites, (cs) => 
                cs.structureType !== STRUCTURE_ROAD && cs.structureType !== STRUCTURE_RAMPART
            );
            if (hasBlockingCS) continue;

            return pos; // Found a walkable and empty spot
        }
    }
    return null; // No walkable spot found
};

// Helper function to display creep counts
function displayCreepCounts(room: Room) {
    const rcl = room.controller?.level || 1;
    const sources = cacheUtils.getSources(room);

    const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === room.name);
    const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === room.name);
    const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === room.name);
    const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === room.name);
    const guards = _.filter(Game.creeps, (c) => c.memory.role === 'guard' && c.room.name === room.name);
    const archers = _.filter(Game.creeps, (c) => c.memory.role === 'archer' && c.room.name === room.name);
    const repairers = _.filter(Game.creeps, (c) => c.memory.role === 'repairer' && c.room.name === room.name);
    const scouts = _.filter(Game.creeps, (c) => c.memory.role === 'scout' && c.room.name === room.name);
    const remoteHarvesters = _.filter(Game.creeps, (c) => c.memory.role === 'remoteHarvester' && c.room.name === room.name);
    const carriers = _.filter(Game.creeps, (c) => c.memory.role === 'carrier' && c.room.name === room.name);
    const reservers = _.filter(Game.creeps, (c) => c.memory.role === 'reserver' && c.room.name === room.name);

    // Calculate targets
    const targetHarvestersPerSource = rcl < 4 ? 2 : 1;
    const totalTargetHarvesters = targetHarvestersPerSource * sources.length;
    const targetSuppliers = totalTargetHarvesters * 2;
    const targetUpgraders = rcl === 1 ? 3 : (rcl === 2 ? 2 : 1);
    const targetBuilders = 1;
    const hostileCreepsInRoom = cacheUtils.getHostiles(room);
    const damagedStructures = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.hits < s.hitsMax, 5);
    const isUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;
    const targetGuards = isUnderAttack ? 1 : 0;
    const targetArchers = isUnderAttack ? 2 : 0;
    const targetRepairers = (damagedStructures.length > 5 && rcl >= 3) ? 1 : 0;

    const lineOffset = 0.9;
    let y = 0.5;

    room.visual.text(`Harvesters: ${harvesters.length}/${totalTargetHarvesters}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Suppliers: ${suppliers.length}/${targetSuppliers}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Upgraders: ${upgraders.length}/${targetUpgraders}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Builders: ${builders.length}/${targetBuilders}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Guards: ${guards.length}/${targetGuards}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Archers: ${archers.length}/${targetArchers}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Repairers: ${repairers.length}/${targetRepairers}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Scouts: ${scouts.length}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Remote Harvesters: ${remoteHarvesters.length}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Carriers: ${carriers.length}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Reservers: ${reservers.length}`, 49, y, { align: "right", opacity: 0.8 });
}


export const loop = () => {
    Watcher();

    // Run Remote Manager to update data from scouts
    managerRemote.run();

    // Run Market Manager to handle excess resources
    managerMarket.run();

    // Inicializar Memory.roomsToExplore se for undefined
    if (!Memory.roomsToExplore) {
        Memory.roomsToExplore = [];
    }

    // Pixel generation logic
    if (Game.cpu.generatePixel && Game.cpu.bucket >= 10000) {
        const anyRoomUnderAttack = _.some(Game.rooms, (room) => cacheUtils.getHostiles(room).length > 0);

        if (!anyRoomUnderAttack) {
            Game.cpu.generatePixel();
            console.log("[Main] Generated a Pixel! 💎");
        } else {
            console.log("[Main] Suspending pixel generation: Room(s) under attack! ⚔️");
        }
    }

    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        // Inicializar Memory.rooms[roomName].layout se não existir
        if (!room.memory.layout) {
            room.memory.layout = { rcl: {}, generated: false };
        }

        // console.log(`[Main] Executing loop for room: ${room.name}`);
        managerPlanner.run(room);
        const spawn = (cacheUtils.findInRoom(room, FIND_MY_SPAWNS) as StructureSpawn[])[0];
        if (!spawn) continue;
        managerSpawner.run(room, spawn);

        displayCreepCounts(room);

        // Run Tower Manager
        managerTower.run(room);

        // Safe Mode Activation Logic
        if (room.controller && room.controller.my && !room.controller.safeMode && room.controller.safeModeAvailable > 0) {
            const hostiles = cacheUtils.getHostiles(room);
            if (hostiles.length > 0) {
                const criticalStructures = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s: any) => 
                    (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_TOWER) && s.hits < s.hitsMax, 1);
                if (criticalStructures.length > 0) {
                    room.controller.activateSafeMode();
                    console.log(`[Main] Safe Mode activated in room ${room.name}! Critical structures under attack.`);
                }
            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') roleHarvester.run(creep);
        if (creep.memory.role === 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role === 'supplier') roleSupplier.run(creep);
        if (creep.memory.role === 'builder') roleBuilder.run(creep);
        if (creep.memory.role === 'guard') roleGuard.run(creep);
        if (creep.memory.role === 'archer') roleArcher.run(creep);
        if (creep.memory.role === 'repairer') roleRepairer.run(creep);
        if (creep.memory.role === 'scout') roleScout.run(creep);
        if (creep.memory.role === 'remoteHarvester') roleRemoteHarvester.run(creep);
        if (creep.memory.role === 'carrier') roleCarrier.run(creep);
        if (creep.memory.role === 'reserver') roleReserver.run(creep);
    }

    // Opcional: Limpar cache no final do tick para evitar vazamentos de memória global
    // cacheUtils.clearTickCache();
};

import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';
import roleGuard from './role.guard'; // Novo
import roleArcher from './role.archer'; // Novo
import roleRepairer from './role.repairer'; // Novo
import managerPlanner from './manager.planner';
import managerSpawner from './manager.spawner';
import { managerTower } from './manager.tower'; // Add this line
import Watcher from './watch-client'; // Change to default import

declare global {
    interface RoomMemory {
        travelTimes?: { [key: string]: number };
    }
    interface CreepMemory {
        role: string;
        sourceId?: Id<Source>;
        targetEnergyId?: Id<any>;
        deliveryTargetId?: Id<any>;
        assignedSupplier?: Id<Creep>;
        upgrading?: boolean;
        building?: boolean;
        state?: string;
        repairing?: boolean; // Novo
    }
    interface RoomPosition {
        isWalkable(creepLooking?: Creep): boolean;
        getAdjacentPositions(): RoomPosition[];
        hasCreep(): boolean;
    }
}

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
    if (_.some(structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType) && (!('my' in s) || !(s as OwnedStructure).my))) {
        return false;
    }

    const constructionSites = this.lookFor(LOOK_CONSTRUCTION_SITES);
    if (_.some(constructionSites, (cs) => OBSTACLE_OBJECT_TYPES.includes(cs.structureType) && (!('my' in cs) || !(cs as any).my))) {
        return false;
    }
    
    const creeps = this.lookFor(LOOK_CREEPS);
    if (creeps.length > 0 && (!creepLooking || creeps[0].id !== creepLooking.id)) { 
        return false;
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

// Helper function to display creep counts
function displayCreepCounts(room: Room) {
    const rcl = room.controller?.level || 1;
    const sources = room.find(FIND_SOURCES); // Need all sources to calculate harvester target

    const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === room.name);
    const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === room.name);
    const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === room.name);
    const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === room.name);
    const guards = _.filter(Game.creeps, (c) => c.memory.role === 'guard' && c.room.name === room.name); // Novo
    const archers = _.filter(Game.creeps, (c) => c.memory.role === 'archer' && c.room.name === room.name); // Novo
    const repairers = _.filter(Game.creeps, (c) => c.memory.role === 'repairer' && c.room.name === room.name); // Novo

    // Calculate targets (similar to manager.spawner.ts)
    const targetHarvestersPerSource = rcl < 4 ? 2 : 1;
    const totalTargetHarvesters = targetHarvestersPerSource * sources.length;
    const targetSuppliers = sources.length;
    const targetUpgraders = rcl === 1 ? 3 : (rcl === 2 ? 2 : 1);
    const targetBuilders = 1;
    const hostileCreepsInRoom = room.find(FIND_HOSTILE_CREEPS); // Reutilizar aqui para o display
    const damagedStructures = room.find(FIND_MY_STRUCTURES, {
        filter: (s) => s.hits < s.hitsMax
    });
    const isUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;
    const targetGuards = isUnderAttack ? 1 : 0; // Novo
    const targetArchers = isUnderAttack ? 2 : 0; // Novo
    const targetRepairers = (damagedStructures.length > 5 && rcl >= 3) ? 1 : 0; // Novo

    const lineOffset = 0.9;
    let y = 0.5; // Starting Y position

    room.visual.text(`Harvesters: ${harvesters.length}/${totalTargetHarvesters}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Suppliers: ${suppliers.length}/${targetSuppliers}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Upgraders: ${upgraders.length}/${targetUpgraders}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset;
    room.visual.text(`Builders: ${builders.length}/${targetBuilders}`, 49, y, { align: "right", opacity: 0.8 });
    y += lineOffset; // Novo
    room.visual.text(`Guards: ${guards.length}/${targetGuards}`, 49, y, { align: "right", opacity: 0.8 }); // Novo
    y += lineOffset; // Novo
    room.visual.text(`Archers: ${archers.length}/${targetArchers}`, 49, y, { align: "right", opacity: 0.8 }); // Novo
    y += lineOffset; // Novo
    room.visual.text(`Repairers: ${repairers.length}/${targetRepairers}`, 49, y, { align: "right", opacity: 0.8 }); // Novo
}


export const loop = () => {
    Watcher();

    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        managerPlanner.run(room);
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) continue;
        managerSpawner.run(room, spawn);

        displayCreepCounts(room);

        const sources = room.find(FIND_SOURCES);
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === roomName);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === roomName);
        const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === roomName);
        const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const rcl = room.controller?.level || 1;

        // Run Tower Manager
        managerTower.run(room);
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'harvester') roleHarvester.run(creep);
        if (creep.memory.role === 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role === 'supplier') roleSupplier.run(creep);
        if (creep.memory.role === 'builder') roleBuilder.run(creep);
        if (creep.memory.role === 'guard') roleGuard.run(creep); // Novo
        if (creep.memory.role === 'archer') roleArcher.run(creep); // Novo
        if (creep.memory.role === 'repairer') roleRepairer.run(creep); // Novo
    }
};

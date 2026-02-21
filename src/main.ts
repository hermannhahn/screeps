import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';
import roleDefender from './role.defender';
import managerPlanner from './manager.planner';

declare global {
    interface RoomMemory {
        blueprintStage?: number;
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



function getHarvesterBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional creep
    if (energyLimit < BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE]) {
        return []; // Not enough energy for a basic creep, spawn will fail
    }

    // Phase 1: Add one WORK, one CARRY, and one MOVE as a base
    parts.push(WORK, CARRY, MOVE);
    currentCost += BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];

    // Phase 2: Add more WORK parts up to the maximum limit (e.g., 6)
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < 6 && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    // Phase 3: Add remaining CARRY and MOVE parts in a balanced way (1 CARRY, 1 MOVE pair)
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    while (currentCost + pairCost <= energyLimit && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }

    return parts; // Return the constructed parts
}

function getBuilderBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Prioritize CARRY and WORK parts in a 1:1 ratio
    const workCarryCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY];
    while (currentCost + workCarryCost <= energyLimit && parts.length < 48 && parts.filter(p => p === WORK).length < 8) {
        parts.push(WORK, CARRY);
        currentCost += workCarryCost;
    }

    // Add MOVE parts
    while (currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }
    
    // Ensure at least one WORK, CARRY and MOVE part if not enough to form pairs
    if (parts.filter(p => p === WORK).length === 0 && currentCost + BODYPART_COST[WORK] <= energyLimit && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }
    if (parts.filter(p => p === CARRY).length === 0 && currentCost + BODYPART_COST[CARRY] <= energyLimit && parts.length < 48) {
        parts.push(CARRY);
        currentCost += BODYPART_COST[CARRY];
    }
    if (parts.filter(p => p === MOVE).length === 0 && currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }

    return parts.length > 0 ? parts : [WORK, CARRY, MOVE]; // Fallback
}

function getUpgraderBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Prioritize WORK parts
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < 8 && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    // Add CARRY and MOVE parts in a 1:1 ratio
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    while (currentCost + pairCost <= energyLimit && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }
    
    // Ensure at least one CARRY and one MOVE part if not enough to form a pair
    if (parts.filter(p => p === CARRY).length === 0 && currentCost + BODYPART_COST[CARRY] <= energyLimit && parts.length < 48) {
        parts.push(CARRY);
        currentCost += BODYPART_COST[CARRY];
    }
    if (parts.filter(p => p === MOVE).length === 0 && currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }

    return parts.length > 0 ? parts : [WORK, CARRY, MOVE]; // Fallback
}

function getSupplierBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Add 1 WORK part if energy limit allows
    if (energyLimit >= BODYPART_COST[WORK] && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    // Add CARRY and MOVE parts in a 1:1 ratio
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE]; // 50 + 50 = 100
    while (currentCost + pairCost <= energyLimit && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }

    // Ensure at least one CARRY and one MOVE if energy limit permits
    if (parts.filter(p => p === CARRY).length === 0 && currentCost + BODYPART_COST[CARRY] <= energyLimit && parts.length < 48) {
        parts.push(CARRY);
        currentCost += BODYPART_COST[CARRY];
    }
    if (parts.filter(p => p === MOVE).length === 0 && currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }

    return parts.length > 0 ? parts : [CARRY, MOVE]; // Fallback for very low energy, just CARRY and MOVE
}

function getDefenderBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;
    const toughCost = BODYPART_COST[TOUGH];
    while (currentCost + toughCost <= energyLimit && parts.length < 48 && parts.filter(p => p === TOUGH).length < 2) {
        parts.push(TOUGH);
        currentCost += toughCost;
    }
    const pairCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE];
    while (currentCost + pairCost <= energyLimit && parts.length < 48) {
        parts.push(RANGED_ATTACK, MOVE);
        currentCost += pairCost;
    }
    return parts.length > 0 ? parts : [RANGED_ATTACK, MOVE];
}

function getSpawnTime(bodyParts: BodyPartConstant[]): number {
    return bodyParts.length * CREEP_SPAWN_TIME;
}

function getTravelTime(spawn: StructureSpawn, targetPos: RoomPosition, room: Room): number {
    const key = `${spawn.id}_${targetPos.x}_${targetPos.y}`;
    if (!room.memory.travelTimes) room.memory.travelTimes = {};
    if (room.memory.travelTimes[key]) return room.memory.travelTimes[key];

    const path = PathFinder.search(spawn.pos, { pos: targetPos, range: 1 }, {
        plainCost: 2, swampCost: 10,
        roomCallback: (roomName) => {
            let r = Game.rooms[roomName];
            if (!r) return new PathFinder.CostMatrix();
            let costMatrix = new PathFinder.CostMatrix();
            r.find(FIND_STRUCTURES).forEach(s => {
                if (s.structureType !== STRUCTURE_ROAD && OBSTACLE_OBJECT_TYPES.includes(s.structureType) && (s.structureType !== STRUCTURE_RAMPART || !s.my)) {
                    costMatrix.set(s.pos.x, s.pos.y, 255);
                }
            });
            return costMatrix;
        }
    }).path;
    const travelTime = path.length;
    room.memory.travelTimes[key] = travelTime;
    return travelTime;
}

export const loop = () => {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        managerPlanner.run(room);
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) continue;

        const sources = room.find(FIND_SOURCES);
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === roomName);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === roomName);
        const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === roomName);
        const defenders = _.filter(Game.creeps, (c) => c.memory.role === 'defender' && c.room.name === roomName);
        const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const isUnderAttack = hostileCreeps.length > 0 && extensions.length >= 5;
        const rcl = room.controller?.level || 1;

        if (!spawn.spawning) {
            let spawned = false;
            const targetHarvestersPerSource = rcl < 4 ? 2 : 1;
            const totalTargetHarvesters = targetHarvestersPerSource * sources.length;

            if (harvesters.length < totalTargetHarvesters) {
                for (let s of sources) {
                    const harvestersAtSource = _.filter(harvesters, (h) => h.memory.sourceId === s.id);
                    if (harvestersAtSource.length < targetHarvestersPerSource) {
                        const body = harvesters.length === 0 ? getHarvesterBody(energyAvailable) : getHarvesterBody(energyCapacity);
                        spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester', sourceId: s.id } });
                        spawned = true; break;
                    }
                }
            }
            if (!spawned && isUnderAttack && defenders.length < 3) {
                const body = defenders.length === 0 ? getDefenderBody(energyAvailable) : getDefenderBody(energyCapacity);
                spawn.spawnCreep(body, 'Defender' + Game.time, { memory: { role: 'defender' } });
                spawned = true;
            }
            if (!spawned && !isUnderAttack) {
                if (suppliers.length < sources.length) {
                    const body = suppliers.length === 0 ? getSupplierBody(energyAvailable) : getSupplierBody(energyCapacity);
                    spawn.spawnCreep(body, 'Supplier' + Game.time, { memory: { role: 'supplier' } });
                    spawned = true;
                } else {
                    const targetUpgraders = rcl === 1 ? 3 : (rcl === 2 ? 2 : 1);
                    
                    if (upgraders.length < targetUpgraders) {
                        const body = upgraders.length === 0 ? getUpgraderBody(energyAvailable) : getUpgraderBody(energyCapacity);
                        spawn.spawnCreep(body, 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
                        spawned = true;
                    } else if (builders.length < 1) {
                        const body = builders.length === 0 ? getBuilderBody(energyAvailable) : getBuilderBody(energyCapacity);
                        spawn.spawnCreep(body, 'Builder' + Game.time, { memory: { role: 'builder' } });
                        spawned = true;
                    }
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
        if (creep.memory.role === 'defender') roleDefender.run(creep);
    }
};

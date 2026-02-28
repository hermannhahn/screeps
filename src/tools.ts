// src/tools.ts

export function isTerrainValidForRoad(pos: RoomPosition, room: Room): boolean {
    if (!pos || !pos.roomName || pos.x < 0 || pos.y < 0 || pos.x >= 50 || pos.y >= 50) return false;
    const terrain = room.getTerrain().get(pos.x, pos.y);
    if (terrain === TERRAIN_MASK_WALL) return false;
    return true;
}

export function addPlannedStructure(plans: PlannedStructure[], pos: RoomPosition, structureType: StructureConstant, status: PlannedStructure['status'] = 'to_build', room: Room): boolean {
    const exists = plans.some(p => p.pos.x === pos.x && p.pos.y === pos.y && p.structureType === structureType);
    if (exists) return false;
    if (!isTerrainValidForRoad(pos, room)) return false;
    plans.push({ pos, structureType, status });
    return true;
}

export function findClosestAnchor(fromPos: RoomPosition, anchors: RoomPosition[]): RoomPosition | null {
    if (anchors.length === 0) return null;
    let closest: RoomPosition | null = null;
    let minRange = Infinity;
    for (const anchor of anchors) {
        const range = fromPos.getRangeTo(anchor);
        if (range < minRange) {
            minRange = range;
            closest = anchor;
        }
    }
    return closest;
}

export function isSourceSafe(source: Source): boolean {
    const hostiles = source.pos.findInRange(FIND_HOSTILE_CREEPS, 10);
    if (hostiles.length > 0) return false;
    const hostileStructures = source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 10, {
        filter: (s) => s.owner && s.owner.username !== 'Invader' && s.owner.username !== 'Source Keeper'
    });
    if (hostileStructures.length > 0) return false;
    return true;
}

export function generateBody(role: string, energy: number): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    
    if (role === 'harvester' || role === 'remoteHarvester') {
        body.push(CARRY);
        body.push(MOVE);
        let remaining = energy - 100;
        let workParts = Math.floor(remaining / 100);
        if (workParts > 6) workParts = 6;
        if (workParts < 1) workParts = 1;
        for (let i = 0; i < workParts; i++) body.push(WORK);
    } 
    else if (role === 'supplier' || role === 'remoteCarrier') {
        body.push(WORK);
        let remaining = energy - 100;
        let pairs = Math.floor(remaining / 100);
        if (pairs > 15) pairs = 15;
        if (pairs < 1) pairs = 1;
        for (let i = 0; i < pairs; i++) {
            body.push(CARRY);
            body.push(MOVE);
        }
    } 
    else if (role === 'reserver') {
        let sets = Math.floor(energy / 650);
        if (sets > 2) sets = 2;
        if (sets < 1) sets = 1;
        for (let i = 0; i < sets; i++) {
            body.push(CLAIM);
            body.push(MOVE);
        }
    }
    else if (role === 'scout') {
        body = [MOVE];
    }
    else {
        let sets = Math.floor(energy / 200);
        if (sets > 15) sets = 15;
        if (sets < 1) sets = 1;
        for (let i = 0; i < sets; i++) {
            body.push(WORK);
            body.push(CARRY);
            body.push(MOVE);
        }
    }
    return body;
}

export function getEnergyAmount(target: any): number {
    if (!target) return 0;
    if (target.store) return target.store.getUsedCapacity(RESOURCE_ENERGY);
    if (target.amount) return target.amount; 
    return 0;
}

export function isTargetAvailable(creep: Creep, target: any): boolean {
    if (!target) return false;
    let energyAvailable = getEnergyAmount(target);
    if (energyAvailable <= 0) return false;
    const others = _.filter(Game.creeps, (c) => 
        c.room.name === creep.room.name && 
        c.id !== creep.id && 
        c.memory.targetId === target.id
    );
    let reservedAmount = 0;
    for (const other of others) {
        reservedAmount += other.store.getFreeCapacity(RESOURCE_ENERGY);
    }
    return (energyAvailable - reservedAmount) > 0;
}

export function handleDefensiveState(creep: Creep): boolean {
    const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
    if (hostiles.length > 0) {
        sayAction(creep, '🏃💨');
        delete creep.memory.targetId;
        if (creep.memory.role === 'harvester') delete creep.memory.sourceId;
        const goals = hostiles.map(h => ({ pos: h.pos, range: 10 }));
        const path = PathFinder.search(creep.pos, goals, { flee: true, maxRooms: 1, plainCost: 2, swampCost: 10, maxOps: 500 }).path;
        if (path.length > 0) creep.moveByPath(path);
        else {
            const closest = creep.pos.findClosestByRange(hostiles);
            if (closest) {
                const direction = creep.pos.getDirectionTo(closest);
                const fleeDirection = (direction + 4) % 8 || 8; 
                creep.move(fleeDirection as DirectionConstant);
            }
        }
        return true;
    }
    return false;
}

export function sayAction(creep: Creep, message: string): void {
    if (creep.memory.lastAction !== message) {
        creep.say(message, false);
        creep.memory.lastAction = message;
    }
}

export function travelToRoom(creep: Creep, roomName: string): boolean {
    if (creep.room.name !== roomName) {
        const exitDir = creep.room.findExitTo(roomName);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
            const exit = creep.pos.findClosestByRange(exitDir as ExitConstant);
            if (exit) {
                creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
                return true;
            }
        }
    }
    return false;
}

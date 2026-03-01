// src/tools.ts

export function isTerrainValidForRoad(pos: RoomPosition, room: Room): boolean {
    if (!pos || !pos.roomName || pos.x < 0 || pos.y < 0 || pos.x >= 50 || pos.y >= 50) return false;
    
    // Usa Game.map para obter o terreno da sala correta, mesmo que não tenhamos visibilidade total
    const terrain = Game.map.getRoomTerrain(pos.roomName).get(pos.x, pos.y);
    if (terrain === TERRAIN_MASK_WALL) return false;
    return true;
}

export function addPlannedStructure(plans: PlannedStructure[], pos: RoomPosition, structureType: StructureConstant, status: PlannedStructure['status'] = 'to_build', room: Room): boolean {
    // Verificação de duplicata corrigida: agora inclui o roomName
    const exists = plans.some(p => p.pos.x === pos.x && p.pos.y === pos.y && p.pos.roomName === pos.roomName && p.structureType === structureType);
    if (exists) return false;

    if (!isTerrainValidForRoad(pos, room)) return false;

    plans.push({ 
        pos: { x: pos.x, y: pos.y, roomName: pos.roomName } as any, // Salva como objeto simples para compatibilidade JSON
        structureType, 
        status 
    });
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
        body.push(CARRY); body.push(MOVE);
        let rem = energy - 100;
        let w = Math.floor(rem / 100);
        if (w > 6) w = 6; if (w < 1) w = 1;
        for (let i = 0; i < w; i++) body.push(WORK);
    } else if (role === 'supplier' || role === 'remoteCarrier') {
        body.push(WORK);
        let rem = energy - 100;
        let p = Math.floor(rem / 100);
        if (p > 15) p = 15; if (p < 1) p = 1;
        for (let i = 0; i < p; i++) { body.push(CARRY); body.push(MOVE); }
    } else if (role === 'reserver') {
        let s = Math.floor(energy / 650);
        if (s > 2) s = 2; if (s < 1) s = 1;
        for (let i = 0; i < s; i++) { body.push(CLAIM); body.push(MOVE); }
    } else if (role === 'scout') {
        body = [MOVE];
    } else {
        let s = Math.floor(energy / 200);
        if (s > 15) s = 15; if (s < 1) s = 1;
        for (let i = 0; i < s; i++) { body.push(WORK); body.push(CARRY); body.push(MOVE); }
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
    const others = _.filter(Game.creeps, (c) => c.room.name === creep.room.name && c.id !== creep.id && c.memory.targetId === target.id);
    let reservedAmount = 0;
    for (const other of others) reservedAmount += other.store.getFreeCapacity(RESOURCE_ENERGY);
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
    if (creep.room.name === roomName) return false;
    const exitDir = creep.room.findExitTo(roomName);
    if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
        const exit = creep.pos.findClosestByRange(exitDir as ExitConstant);
        if (exit) {
            creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 20 });
            return true;
        }
    }
    return false;
}

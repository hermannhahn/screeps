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

// Gerador de corpos dinâmicos (Corrigido)
export function generateBody(role: string, energy: number): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    
    if (role === 'harvester') {
        // Harvester: Base [WORK, CARRY, MOVE] = 200. Cada WORK extra = 100.
        body.push(CARRY);
        body.push(MOVE);
        let remaining = energy - 100;
        let workParts = Math.floor(remaining / 100);
        if (workParts > 6) workParts = 6;
        if (workParts < 1) workParts = 1;
        for (let i = 0; i < workParts; i++) body.push(WORK);
    } 
    else if (role === 'supplier') {
        // Supplier: 1 WORK fixo (100). Resto pares [CARRY, MOVE] (100) ou trios [CARRY, CARRY, MOVE] (150).
        // Vamos usar pares [CARRY, MOVE] para garantir que o custo seja respeitado.
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
    else {
        // Builder e Upgrader: [WORK, CARRY, MOVE] = 200
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

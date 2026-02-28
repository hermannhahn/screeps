// src/tools.ts
export function isTerrainValidForRoad(pos: RoomPosition, room: Room): boolean {
    if (!pos || !pos.roomName || pos.x < 0 || pos.y < 0 || pos.x >= 50 || pos.y >= 50) return false;
    const terrain = room.getTerrain().get(pos.x, pos.y);
    if (terrain === TERRAIN_MASK_WALL) return false;
    const existingObjects = room.lookAt(pos);
    for (const obj of existingObjects) {
        if (obj.structure && obj.structure.structureType !== STRUCTURE_ROAD) return false;
        if (obj.constructionSite && obj.constructionSite.structureType !== STRUCTURE_ROAD) return false;
    }
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
    const hostiles = source.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
    if (hostiles.length > 0) return false;
    const hostileStructures = source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, {
        filter: (s) => s.owner && s.owner.username !== 'Invader' && s.owner.username !== 'Source Keeper'
    });
    if (hostileStructures.length > 0) return false;
    return true;
}

export function generateBody(role: string, energy: number): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    if (role === 'harvester') {
        let workParts = Math.floor((energy - 100) / 100);
        if (workParts > 6) workParts = 6;
        if (workParts < 1) workParts = 1;
        for (let i = 0; i < workParts; i++) body.push(WORK);
        body.push(CARRY);
        body.push(MOVE);
    } else if (role === 'supplier') {
        body.push(WORK);
        let remainingEnergy = energy - 100;
        let pairs = Math.floor(remainingEnergy / 100);
        if (pairs > 15) pairs = 15;
        if (pairs < 1) pairs = 1;
        for (let i = 0; i < pairs; i++) {
            body.push(CARRY);
            body.push(CARRY);
            body.push(MOVE);
        }
    } else {
        let parts = Math.floor(energy / 200);
        if (parts > 15) parts = 15;
        if (parts < 1) parts = 1;
        for (let i = 0; i < parts; i++) {
            body.push(WORK);
            body.push(CARRY);
            body.push(MOVE);
        }
    }
    return body;
}

// --- LOGICA DE RESERVA DE ENERGIA ---

// Retorna a quantidade de energia disponível no alvo (Structure ou Resource)
export function getEnergyAmount(target: any): number {
    if (target.store) return target.store.getUsedCapacity(RESOURCE_ENERGY);
    if (target.amount) return target.amount; // Para Resources
    return 0;
}

// Verifica se há energia suficiente sobrando para o creep após descontar os outros que já miraram o alvo
export function isTargetAvailable(creep: Creep, target: any): boolean {
    if (!target) return false;
    
    let energyAvailable = getEnergyAmount(target);
    if (energyAvailable <= 0) return false;

    // Buscar outros creeps que já têm esse alvo
    const others = _.filter(Game.creeps, (c) => 
        c.room.name === creep.room.name && 
        c.id !== creep.id && 
        c.memory.targetId === target.id
    );

    // Subtrair o espaço livre de carga de cada creep indo pro mesmo alvo
    let reservedAmount = 0;
    for (const other of others) {
        reservedAmount += other.store.getFreeCapacity(RESOURCE_ENERGY);
    }

    // O alvo está disponível se sobrar energia após as reservas
    return (energyAvailable - reservedAmount) > 0;
}

// src/tools.ts
export function isTerrainValidForRoad(pos: RoomPosition, room: Room): boolean {
    if (!pos || !pos.roomName || pos.x < 0 || pos.y < 0 || pos.x >= 50 || pos.y >= 50) return false;
    
    // Novo método recomendado para verificar terreno
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

// Função para verificar se um source é seguro (sem inimigos ou estruturas hostis em range 5)
export function isSourceSafe(source: Source): boolean {
    const hostiles = source.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
    if (hostiles.length > 0) return false;

    const hostileStructures = source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, {
        filter: (s) => s.owner && s.owner.username !== 'Invader' && s.owner.username !== 'Source Keeper'
    });
    if (hostileStructures.length > 0) return false;

    return true;
}

// Gerador de corpos dinâmicos
export function generateBody(role: string, energy: number): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    
    if (role === 'harvester') {
        // Harvester: Prioriza WORK. Precisa de 1 MOVE e 1 CARRY mínimo.
        // Base: [WORK, WORK, CARRY, MOVE] = 300
        let workParts = Math.floor((energy - 100) / 100);
        if (workParts > 6) workParts = 6; // Limite prático para RCL baixo/médio
        if (workParts < 1) workParts = 1;
        
        for (let i = 0; i < workParts; i++) body.push(WORK);
        body.push(CARRY);
        body.push(MOVE);
    } 
    else if (role === 'supplier') {
        // Supplier: 1 WORK fixo, resto CARRY e MOVE (proporção 2:1 ou 1:1)
        // Base: [WORK, CARRY, CARRY, MOVE, MOVE] = 300
        body.push(WORK);
        let remainingEnergy = energy - 100;
        let pairs = Math.floor(remainingEnergy / 100); // Par de CARRY + MOVE
        if (pairs > 15) pairs = 15;
        if (pairs < 1) pairs = 1;

        for (let i = 0; i < pairs; i++) {
            body.push(CARRY);
            body.push(CARRY); // 2 Carry para 1 Move se estiver em estrada (mais eficiente)
            body.push(MOVE);
        }
    }
    else {
        // Builder e Upgrader: Equilibrado WORK, CARRY, MOVE
        // Base: [WORK, CARRY, MOVE] = 200
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

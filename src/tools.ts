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

    // Em modo Simulação ou salas vazias, findInRange(FIND_HOSTILE_STRUCTURES) pode retornar estruturas neutras em alguns servidores
    // Vamos garantir que estamos filtrando por estruturas que realmente pertencem a outros jogadores
    const hostileStructures = source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5, {
        filter: (s) => s.owner && s.owner.username !== 'Invader' && s.owner.username !== 'Source Keeper'
    });
    if (hostileStructures.length > 0) return false;

    return true;
}

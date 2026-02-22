export function planRoadsFromToNearestRoad(room: Room, startPos: RoomPosition): number {
    const existingRoads = room.find(FIND_STRUCTURES, {
        filter: (s: AnyStructure) => s.structureType === STRUCTURE_ROAD
    }).concat(room.find(FIND_CONSTRUCTION_SITES, {
        filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
    } as any) as any);

    if (existingRoads.length === 0) return 0;
    const nearestRoad = startPos.findClosestByPath(existingRoads);
    if (!nearestRoad) return 0;

    const path = room.findPath(startPos, nearestRoad.pos, {
        ignoreCreeps: true, swampCost: 1, plainCost: 1
    });

    let sitesCreated = 0;
    for (const segment of path) {
        if (room.createConstructionSite(segment.x, segment.y, STRUCTURE_ROAD) === OK) {
            sitesCreated++;
        }
    }
    return sitesCreated;
}

export function planRoadFromTo(room: Room, startPos: RoomPosition, endPos: RoomPosition): number {
    const path = room.findPath(startPos, endPos, {
        ignoreCreeps: true, swampCost: 1, plainCost: 1, maxOps: 2000
    });

    let sitesCreated = 0;
    for (const segment of path) {
        if (room.createConstructionSite(segment.x, segment.y, STRUCTURE_ROAD) === OK) {
            sitesCreated++;
        }
    }
    return sitesCreated;
}

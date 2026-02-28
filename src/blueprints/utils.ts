import { cacheUtils } from '../utils.cache';

export function findTargetForRoadConnection(room: Room, startPos: RoomPosition): RoomPosition | null {
    // 1. Get all existing roads and construction sites for roads
    const existingRoads = cacheUtils.findInRoom(room, FIND_STRUCTURES, (s: AnyStructure) => s.structureType === STRUCTURE_ROAD)
        .concat(cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES, (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD) as any);

    // 2. Filter roads to find those that are at least some distance away to avoid connecting to itself
    const distantRoads = existingRoads.filter(r => r.pos.getRangeTo(startPos) > 2);

    if (distantRoads.length > 0) {
        const nearestRoad = startPos.findClosestByPath(distantRoads as (StructureRoad | ConstructionSite)[]);
        if (nearestRoad) {
            return nearestRoad.pos;
        }
    }

    // Fall back to spawn
    const spawns = cacheUtils.findInRoom(room, FIND_MY_SPAWNS);
    if (spawns.length > 0) {
        return spawns[0].pos;
    }

    return null;
}

export function planRoadsFromToNearestRoad(room: Room, startPos: RoomPosition): number {
    const targetPos = findTargetForRoadConnection(room, startPos);
    if (!targetPos) return 0;

    const path = room.findPath(startPos, targetPos, {
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

export function planRoadFromTo(room: Room, startPos: RoomPosition, endPos: RoomPosition): number {
    const path = room.findPath(startPos, endPos, {
        ignoreCreeps: true, swampCost: 1, plainCost: 1, maxOps: 2000
    });

    if (path.length === 0 && startPos.getRangeTo(endPos) > 1) {
        console.log(`[BlueprintUtils] Failed to find path from ${startPos} to ${endPos}`);
    }

    let sitesCreated = 0;
    for (const segment of path) {
        const result = room.createConstructionSite(segment.x, segment.y, STRUCTURE_ROAD);
        if (result === OK) {
            sitesCreated++;
        } else if (result !== ERR_INVALID_TARGET && result !== ERR_FULL) {
            // console.log(`[BlueprintUtils] createConstructionSite failed at ${segment.x},${segment.y}: ${result}`);
        }
    }
    return sitesCreated;
}

export function findSourceContainer(source: Source): StructureContainer | ConstructionSite | null {
    // Check for existing container
    const container = source.pos.findInRange(cacheUtils.findInRoom(source.room, FIND_STRUCTURES, (s) => s.structureType === STRUCTURE_CONTAINER), 3)[0] as StructureContainer;

    if (container) return container;

    // Check for container construction site
    const containerCS = source.pos.findInRange(cacheUtils.findInRoom(source.room, FIND_CONSTRUCTION_SITES, (cs) => cs.structureType === STRUCTURE_CONTAINER), 3)[0] as ConstructionSite;

    if (containerCS) return containerCS;

    return null;
}

export function isSafePosition(pos: RoomPosition): boolean {
    const room = Game.rooms[pos.roomName];
    if (!room) return true;

    const hostiles = cacheUtils.getHostiles(room).filter(c => 
        c.getActiveBodyparts(ATTACK) > 0 || 
        c.getActiveBodyparts(RANGED_ATTACK) > 0 || 
        c.getActiveBodyparts(WORK) > 0 ||
        c.getActiveBodyparts(HEAL) > 0
    );

    const enemiesInRange = pos.findInRange(hostiles, 5); // 5 tiles radius
    if (enemiesInRange.length > 0) return false;

    const hostileStructuresInRange = pos.findInRange(cacheUtils.findInRoom(room, FIND_HOSTILE_STRUCTURES), 5);
    return hostileStructuresInRange.length === 0;
}

export function isRoadPathComplete(room: Room, startPos: RoomPosition, endPos: RoomPosition): boolean {
    const path = room.findPath(startPos, endPos, {
        ignoreCreeps: true, swampCost: 1, plainCost: 1, maxOps: 2000
    });

    if (path.length === 0) {
        const range = startPos.getRangeTo(endPos);
        if (range > 1) {
            // console.log(`[BlueprintUtils] isRoadPathComplete: Empty path found for range ${range} between ${startPos} and ${endPos}`);
            return false;
        }
        return true;
    }

    return path.every(segment => {
        const pos = room.getPositionAt(segment.x, segment.y);
        if (!pos) return false;
        const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
        const hasRoadCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(cs => cs.structureType === STRUCTURE_ROAD);
        return hasRoad || hasRoadCS;
    });
}

export function findControllerContainer(room: Room): StructureContainer | ConstructionSite | null {
    if (!room.controller) return null;

    // Check for existing container
    const container = room.controller.pos.findInRange(cacheUtils.findInRoom(room, FIND_STRUCTURES, (s) => s.structureType === STRUCTURE_CONTAINER), 3)[0] as StructureContainer;

    if (container) return container;

    // Check for container construction site
    const containerCS = room.controller.pos.findInRange(cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES, (cs) => cs.structureType === STRUCTURE_CONTAINER), 3)[0] as ConstructionSite;

    if (containerCS) return containerCS;

    return null;
}


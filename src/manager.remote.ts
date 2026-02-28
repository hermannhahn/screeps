import _ from 'lodash';
import { cacheUtils } from './utils.cache';

export interface RemoteRoomData {
    sources: { id: Id<Source>; pos: RoomPosition }[]; // Changed to RoomPosition
    controller?: { id: Id<StructureController>; pos: RoomPosition }; // Changed to RoomPosition
    needsReserving?: boolean;
    lastScouted: number;
    safe: boolean;
    hasEnemyStructures: boolean;
}

const managerRemote = {
    run: function() {
        if (!Memory.remoteRooms) {
            Memory.remoteRooms = {};
        }

        // Logic to update remote rooms status and needs
        // This will be called in the main loop
        this.updateScoutingData();
    },

    updateScoutingData: function() {
        for (const creepName in Game.creeps) {
            const creep = Game.creeps[creepName];
            if (creep.memory.role === 'scout' && creep.room.name === creep.memory.targetRoom) {
                const room = creep.room;
                
                const sources = cacheUtils.getSources(room).map(s => ({
                    id: s.id,
                    pos: s.pos // Save as RoomPosition
                }));

                const hostiles = cacheUtils.getHostiles(room);
                const hostileStructures = cacheUtils.findInRoom(room, FIND_HOSTILE_STRUCTURES, undefined, 100);

                Memory.remoteRooms[room.name] = {
                    sources: sources,
                    controller: room.controller ? { id: room.controller.id, pos: room.controller.pos } : undefined, // Save as RoomPosition
                    needsReserving: room.controller && !room.controller.my && (!room.controller.reservation || room.controller.reservation.ticksToEnd < 2000),
                    lastScouted: Game.time,
                    safe: hostiles.length === 0,
                    hasEnemyStructures: hostileStructures.length > 0
                };

                // Planejar infraestrutura se for seguro
                if (hostiles.length === 0 && hostileStructures.length === 0) {
                    this.planRemoteInfrastructure(room, creep.memory.homeRoom);
                }
            }
        }
    },

    planRemoteInfrastructure: function(room: Room, homeRoomName?: string) {
        if (!homeRoomName) return;

        const sources = cacheUtils.getSources(room);
        const exitDir = room.findExitTo(homeRoomName);
        if (exitDir === ERR_INVALID_ARGS || exitDir === ERR_NO_PATH) return;

        const exits = cacheUtils.findInRoom(room, exitDir as any);
        if (exits.length === 0) return;
        const exit = exits[0];

        for (const source of sources) {
            // 1. Planejar Container perto da fonte
            const hasContainer = source.pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } }).length > 0;
            const hasContainerCS = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, { filter: { structureType: STRUCTURE_CONTAINER } }).length > 0;

            if (!hasContainer && !hasContainerCS) {
                const spot = source.pos.findAdjacentWalkableSpot();
                if (spot) {
                    room.createConstructionSite(spot, STRUCTURE_CONTAINER);
                }
            }

            // 2. Planejar Estrada da fonte até a saída
            const exitPos = (exit as any).pos || exit; // Handle different return types of room.find
            const path = room.findPath(source.pos, exitPos, { ignoreCreeps: true, swampCost: 1, plainCost: 1 });
            for (const step of path) {
                room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
            }
        }

        // 3. Planejar Estrada do controller até a saída (para reservers)
        if (room.controller) {
            const exitPos = (exit as any).pos || exit;
            const path = room.findPath(room.controller.pos, exitPos, { ignoreCreeps: true, swampCost: 1, plainCost: 1 });
            for (const step of path) {
                room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
            }
        }
    },

    getRemoteHarvestTargets: function(homeRoom: Room) {
        // Returns a list of potential remote harvest targets (sources in nearby safe rooms)
        const targets: { roomName: string; sourceId: Id<Source> }[] = [];
        
        for (const roomName in Memory.remoteRooms) {
            // Ignore the home room itself
            if (roomName === homeRoom.name) continue;

            const data = Memory.remoteRooms[roomName] as RemoteRoomData;
            // Simplified logic: only take rooms that are safe and scouted recently
            if (data.safe && !data.hasEnemyStructures && (Game.time - data.lastScouted < 5000)) {
                for (const source of data.sources) {
                    targets.push({ roomName: roomName, sourceId: source.id });
                }
            }
        }
        
        return targets;
    }
};

export default managerRemote;

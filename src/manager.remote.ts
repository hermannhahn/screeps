import _ from 'lodash';

export interface RemoteRoomData {
    sources: { id: Id<Source>; pos: { x: number; y: number } }[];
    controllerPos?: { x: number; y: number };
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
                
                const sources = room.find(FIND_SOURCES).map(s => ({
                    id: s.id,
                    pos: { x: s.pos.x, y: s.pos.y }
                }));

                const hostiles = room.find(FIND_HOSTILE_CREEPS);
                const hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);

                Memory.remoteRooms[room.name] = {
                    sources: sources,
                    controllerPos: room.controller ? { x: room.controller.pos.x, y: room.controller.pos.y } : undefined,
                    needsReserving: room.controller && !room.controller.my && (!room.controller.reservation || room.controller.reservation.ticksToEnd < 2000),
                    lastScouted: Game.time,
                    safe: hostiles.length === 0,
                    hasEnemyStructures: hostileStructures.length > 0
                };
            }
        }
    },

    getRemoteHarvestTargets: function(homeRoom: Room) {
        // Returns a list of potential remote harvest targets (sources in nearby safe rooms)
        const targets: { roomName: string; sourceId: Id<Source> }[] = [];
        
        for (const roomName in Memory.remoteRooms) {
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

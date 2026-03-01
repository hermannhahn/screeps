// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    // Descoberta dinâmica de salas vizinhas a partir de QUALQUER sala com visão
    for (const visibleRoomName in Game.rooms) {
        if (visibleRoomName === room.name) {
             const exits = Game.map.describeExits(visibleRoomName);
             if (exits) {
                 Object.values(exits).forEach(neighborName => {
                     if (neighborName !== room.name && !Memory.remoteMining![neighborName]) {
                         Memory.remoteMining![neighborName] = { sources: [], sourcePositions: [], reserverNeeded: false, isHostile: false, lastScouted: 0 };
                     }
                 });
             }
             continue;
        }

        const visibleRoom = Game.rooms[visibleRoomName];
        const exits = Game.map.describeExits(visibleRoomName);
        
        if (exits) {
            Object.values(exits).forEach(neighborName => {
                if (neighborName !== room.name && !Memory.remoteMining![neighborName]) {
                    Memory.remoteMining![neighborName] = { sources: [], sourcePositions: [], reserverNeeded: false, isHostile: false, lastScouted: 0 };
                }
            });
        }

        const data = Memory.remoteMining[visibleRoomName];
        if (data && (Game.time - data.lastScouted > 100 || data.sources.length === 0)) {
            const sources = visibleRoom.find(FIND_SOURCES);
            if (sources.length > 0) {
                console.log(`RemoteManager: Updating data for visible room ${visibleRoomName} (${sources.length} sources found)`);
                data.sources = sources.map(s => s.id);
                data.sourcePositions = sources.map(s => ({ x: s.pos.x, y: s.pos.y }));
                const controller = visibleRoom.controller;
                data.reserverNeeded = !!controller && !controller.owner;
                const hostiles = visibleRoom.find(FIND_HOSTILE_CREEPS).length > 0 || visibleRoom.find(FIND_HOSTILE_STRUCTURES).length > 0;
                data.isHostile = hostiles || !!(controller && controller.owner && !controller.my);
                data.lastScouted = Game.time;
            }
        }
    }
}

export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string, sourceId?: string } | null {
    if (!Memory.remoteMining) return null;

    const allCreeps = Object.values(Game.creeps);
    const allScouts = allCreeps.filter(c => c.memory.role === 'scout');
    
    // PASSAGEM 1: PRIORIDADE PARA SCOUTS (Limite global 2)
    if (allScouts.length < 2) {
        for (const remoteRoomName in Memory.remoteMining) {
            const data = Memory.remoteMining[remoteRoomName];
            if (Game.map.getRoomLinearDistance(room.name, remoteRoomName) > 2) continue;

            const scoutInterval = data.isHostile ? 50000 : 10000;
            if (data.lastScouted === 0 || Game.time - data.lastScouted > scoutInterval) {
                const scoutsTargeting = allScouts.filter(c => c.memory.targetRoom === remoteRoomName);
                if (scoutsTargeting.length < 1) return { role: 'scout', targetRoom: remoteRoomName };
            }
        }
    }

    // PASSAGEM 2: OUTRAS ROLES (Harvesters, Carriers, Reservers)
    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        if (Game.map.getRoomLinearDistance(room.name, remoteRoomName) > 2) continue;
        if (data.isHostile || data.sources.length === 0) continue;

        const creepsInTarget = allCreeps.filter(c => c.memory.targetRoom === remoteRoomName);
        const harvesters = creepsInTarget.filter(c => c.memory.role === 'remoteHarvester');
        const carriers = creepsInTarget.filter(c => c.memory.role === 'remoteCarrier');
        const reservers = creepsInTarget.filter(c => c.memory.role === 'reserver');

        // Spawna Harvesters para cada fonte
        for (const sourceId of data.sources) {
            if (!harvesters.some(h => h.memory.sourceId === sourceId)) {
                return { role: 'remoteHarvester', targetRoom: remoteRoomName, sourceId: sourceId };
            }
        }

        // Spawna Carriers (1 por harvester)
        if (carriers.length < harvesters.length) {
            return { role: 'remoteCarrier', targetRoom: remoteRoomName };
        }

        // Spawna Reservers
        if (data.reserverNeeded && room.controller && room.controller.level >= 3) {
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }
    }

    return null;
}

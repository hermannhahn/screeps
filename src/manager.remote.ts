// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    // OTIMIZAÇÃO: Roda apenas a cada 50 ticks
    if (Game.time % 50 !== 0) return;

    // LIMPEZA: Remove salas com distância linear > 1 para focar CPU
    for (const roomName in Memory.remoteMining) {
        if (Game.map.getRoomLinearDistance(room.name, roomName) > 1) {
            delete Memory.remoteMining[roomName];
        }
    }

    // DESCOBERTA: Apenas vizinhos diretos da Home Room
    const exits = Game.map.describeExits(room.name);
    if (exits) {
        Object.values(exits).forEach(neighborName => {
            if (!Memory.remoteMining![neighborName]) {
                Memory.remoteMining![neighborName] = { sources: [], sourcePositions: [], reserverNeeded: false, isHostile: false, lastScouted: 0 };
            }
        });
    }

    // ATUALIZAÇÃO AUTOMÁTICA DE VISÃO (Vizinhos diretos)
    for (const roomName in Memory.remoteMining) {
        const targetRoom = Game.rooms[roomName];
        if (targetRoom) {
            const data = Memory.remoteMining[roomName];
            const sources = targetRoom.find(FIND_SOURCES);
            if (sources.length > 0) {
                data.sources = sources.map(s => s.id);
                data.sourcePositions = sources.map(s => ({ x: s.pos.x, y: s.pos.y }));
                data.reserverNeeded = !!targetRoom.controller && !targetRoom.controller.owner;
                data.isHostile = targetRoom.find(FIND_HOSTILE_CREEPS).length > 0;
                data.lastScouted = Game.time;
            }
        }
    }
}

export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string, sourceId?: string } | null {
    if (!Memory.remoteMining) return null;

    const allCreeps = Object.values(Game.creeps);
    const allScouts = allCreeps.filter(c => c.memory.role === 'scout');
    
    // 1. SCOUTS (Limite global 1 para base RCL 3)
    if (allScouts.length < 1) {
        for (const remoteRoomName in Memory.remoteMining) {
            const data = Memory.remoteMining[remoteRoomName];
            if (data.lastScouted === 0 || Game.time - data.lastScouted > 5000) {
                return { role: 'scout', targetRoom: remoteRoomName };
            }
        }
    }

    // 2. MINERADORES (Apenas vizinhos diretos)
    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        if (data.isHostile || data.sources.length === 0) continue;

        const creepsInTarget = allCreeps.filter(c => c.memory.targetRoom === remoteRoomName);
        const harvesters = creepsInTarget.filter(c => c.memory.role === 'remoteHarvester');
        const carriers = creepsInTarget.filter(c => c.memory.role === 'remoteCarrier');

        // Harvesters
        for (const sourceId of data.sources) {
            if (!harvesters.some(h => h.memory.sourceId === sourceId)) {
                return { role: 'remoteHarvester', targetRoom: remoteRoomName, sourceId: sourceId };
            }
        }

        // Carriers
        if (carriers.length < harvesters.length) {
            return { role: 'remoteCarrier', targetRoom: remoteRoomName };
        }

        // Reservers (Apenas se sobrar energia)
        if (data.reserverNeeded && room.energyAvailable > 700) {
            const reservers = creepsInTarget.filter(c => c.memory.role === 'reserver');
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }
    }

    return null;
}

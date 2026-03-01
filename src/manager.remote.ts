// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    // OTIMIZAÇÃO: Roda apenas a cada 20 ticks
    if (Game.time % 20 !== 0) return;

    // 1. LIMPEZA: Remove a Home Room e salas com raio > 2 da memória
    if (Memory.remoteMining[room.name]) delete Memory.remoteMining[room.name];
    
    for (const roomName in Memory.remoteMining) {
        if (Game.map.getRoomLinearDistance(room.name, roomName) > 2) {
            delete Memory.remoteMining[roomName];
        }
    }

    // 2. DESCOBERTA DINÂMICA (Vizinhos da Home e de salas ativas)
    const activeRooms = [room.name, ...Object.keys(Game.rooms)];
    activeRooms.forEach(visibleRoomName => {
        const exits = Game.map.describeExits(visibleRoomName);
        if (exits) {
            Object.values(exits).forEach(neighborName => {
                // SÓ EXPLORA SE: não for a home room, não estiver na memória e for em raio 2
                if (neighborName !== room.name && !Memory.remoteMining![neighborName]) {
                    if (Game.map.getRoomLinearDistance(room.name, neighborName) <= 2) {
                        Memory.remoteMining![neighborName] = { sources: [], sourcePositions: [], reserverNeeded: false, isHostile: false, lastScouted: 0 };
                    }
                }
            });
        }
    });

    // 3. ATUALIZAÇÃO DE DADOS DE VISÃO
    for (const roomName in Game.rooms) {
        const visibleRoom = Game.rooms[roomName];
        if (roomName === room.name) continue; // Pula a home room

        const data = Memory.remoteMining[roomName];
        if (data) {
            const sources = visibleRoom.find(FIND_SOURCES);
            if (sources.length > 0) {
                data.sources = sources.map(s => s.id);
                data.sourcePositions = sources.map(s => ({ x: s.pos.x, y: s.pos.y }));
                data.reserverNeeded = !!visibleRoom.controller && !visibleRoom.controller.owner;
                data.isHostile = visibleRoom.find(FIND_HOSTILE_CREEPS).length > 0 || visibleRoom.find(FIND_HOSTILE_STRUCTURES).length > 0;
                data.lastScouted = Game.time;
            }
        }
    }
}

export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string, sourceId?: string } | null {
    if (!Memory.remoteMining) return null;

    const allCreeps = Object.values(Game.creeps);
    const allScouts = allCreeps.filter(c => c.memory.role === 'scout');
    
    // 1. PRIORIDADE: SCOUTS (Limite global 2)
    if (allScouts.length < 2) {
        for (const remoteRoomName in Memory.remoteMining) {
            if (remoteRoomName === room.name) continue;
            const data = Memory.remoteMining[remoteRoomName];
            if (data.lastScouted === 0 || (data.sourcePositions && data.sourcePositions.length > 0 && data.sources.length === 0)) {
                if (!allScouts.some(s => s.memory.targetRoom === remoteRoomName)) {
                    return { role: 'scout', targetRoom: remoteRoomName };
                }
            }
        }
    }

    // 2. PRIORIDADE: MINERADORES (Apenas vizinhos válidos)
    for (const remoteRoomName in Memory.remoteMining) {
        if (remoteRoomName === room.name) continue;
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

        // Reservers
        if (data.reserverNeeded && room.energyAvailable >= 750) {
            const reservers = creepsInTarget.filter(c => c.memory.role === 'reserver');
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }
    }

    return null;
}

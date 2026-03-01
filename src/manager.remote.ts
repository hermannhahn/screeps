// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    // Descoberta dinâmica de salas vizinhas a partir de QUALQUER sala com visão
    for (const visibleRoomName in Game.rooms) {
        // Pula a própria sala principal
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
                // SÓ EXPLORA SE: não for a home room e não estiver na memória
                if (neighborName !== room.name && !Memory.remoteMining![neighborName]) {
                    Memory.remoteMining![neighborName] = { sources: [], sourcePositions: [], reserverNeeded: false, isHostile: false, lastScouted: 0 };
                }
            });
        }

        // Se a sala está visível, atualizamos os dados dela mesmo sem o Scout
        const data = Memory.remoteMining[visibleRoomName];
        if (data && (Game.time - data.lastScouted > 100 || data.sources.length === 0)) {
            const sources = visibleRoom.find(FIND_SOURCES);
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
export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string, sourceId?: string } | null {
    if (!Memory.remoteMining) return null;

    // PASSAGEM 1: PRIORIDADE ABSOLUTA PARA SCOUTS (Todas as salas)
    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        const remoteCreeps = _.filter(Game.creeps, c => c.memory.targetRoom === remoteRoomName);
        const scoutInterval = data.isHostile ? 50000 : 10000;
        if (data.lastScouted === 0 || Game.time - data.lastScouted > scoutInterval) {
            const scouts = _.filter(remoteCreeps, c => c.memory.role === 'scout');
            if (scouts.length < 1) return { role: 'scout', targetRoom: remoteRoomName };
        }
    }

    // PASSAGEM 2: OUTRAS ROLES (Harvesters, Reservers, Carriers)
    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        const remoteCreeps = _.filter(Game.creeps, c => c.memory.targetRoom === remoteRoomName);

        if (data.isHostile) continue;
        if (data.sources.length === 0) continue;

        const harvesters = _.filter(remoteCreeps, c => c.memory.role === 'remoteHarvester');
        for (const sourceId of data.sources) {
            const harvestersAtSource = _.filter(harvesters, h => h.memory.sourceId === sourceId);
            if (harvestersAtSource.length < 1) {
                return { role: 'remoteHarvester', targetRoom: remoteRoomName, sourceId: sourceId };
            }
        }

        const carriers = _.filter(remoteCreeps, c => c.memory.role === 'remoteCarrier');
        if (carriers.length < harvesters.length) {
            return { role: 'remoteCarrier', targetRoom: remoteRoomName };
        }

        if (data.reserverNeeded && room.controller && room.controller.level >= 3) {
            const reservers = _.filter(remoteCreeps, c => c.memory.role === 'reserver');
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }
    }

    return null;
}


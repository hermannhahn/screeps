// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    const exits = Game.map.describeExits(room.name);
    if (exits) {
        Object.values(exits).forEach(neighborName => {
            if (!Memory.remoteMining![neighborName]) {
                Memory.remoteMining![neighborName] = {
                    sources: [],
                    sourcePositions: [],
                    reserverNeeded: false,
                    isHostile: false,
                    lastScouted: 0
                };
            }
        });
    }
}

export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string } | null {
    if (!Memory.remoteMining) return null;

    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        const remoteCreeps = _.filter(Game.creeps, c => c.memory.targetRoom === remoteRoomName);

        // Se a sala for hostil, ignoramos ela completamente por um longo período
        const scoutInterval = data.isHostile ? 50000 : 10000;
        if (Game.time - data.lastScouted > scoutInterval) {
            const scouts = _.filter(remoteCreeps, c => c.memory.role === 'scout');
            if (scouts.length < 1) return { role: 'scout', targetRoom: remoteRoomName };
        }

        // BLOQUEIO TOTAL: Se a sala é hostil, não spawna mais nada para lá
        if (data.isHostile) continue;

        if (data.sources.length === 0) continue;

        const harvesters = _.filter(remoteCreeps, c => c.memory.role === 'remoteHarvester');
        if (harvesters.length < data.sources.length) {
            return { role: 'remoteHarvester', targetRoom: remoteRoomName };
        }

        if (data.reserverNeeded && room.controller && room.controller.level >= 3) {
            const reservers = _.filter(remoteCreeps, c => c.memory.role === 'reserver');
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }

        const carriers = _.filter(remoteCreeps, c => c.memory.role === 'remoteCarrier');
        if (carriers.length < harvesters.length * 2) {
            return { role: 'remoteCarrier', targetRoom: remoteRoomName };
        }
    }

    return null;
}

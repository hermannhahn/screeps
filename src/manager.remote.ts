// src/manager.remote.ts
import { isSourceSafe } from './tools';

export function manageRemoteMining(room: Room): void {
    if (!Memory.remoteMining) Memory.remoteMining = {};

    // 1. Descoberta de vizinhos
    const exits = Game.map.describeExits(room.name);
    if (exits) {
        Object.values(exits).forEach(neighborName => {
            if (!Memory.remoteMining![neighborName]) {
                Memory.remoteMining![neighborName] = {
                    sources: [],
                    reserverNeeded: false,
                    isHostile: false,
                    lastScouted: 0
                };
            }
        });
    }
}

// Função para retornar a próxima demanda de spawn remoto
export function getRemoteSpawnRequest(room: Room): { role: string, targetRoom: string } | null {
    if (!Memory.remoteMining) return null;

    for (const remoteRoomName in Memory.remoteMining) {
        const data = Memory.remoteMining[remoteRoomName];
        const remoteCreeps = _.filter(Game.creeps, c => c.memory.targetRoom === remoteRoomName);

        // A. Prioridade 1: Scouting
        // Se a sala for hostil, esperamos 50.000 ticks para tentar scoutar novamente.
        // Se for segura, esperamos 10.000 ticks.
        const scoutInterval = data.isHostile ? 50000 : 10000;
        if (Game.time - data.lastScouted > scoutInterval) {
            const scouts = _.filter(remoteCreeps, c => c.memory.role === 'scout');
            if (scouts.length < 1) return { role: 'scout', targetRoom: remoteRoomName };
        }

        // B. Se a sala for hostil ou não tiver fontes mapeadas, pula os papéis de mineração
        if (data.isHostile || data.sources.length === 0) continue;

        // C. Prioridade 2: Remote Harvesters (1 por fonte)
        const harvesters = _.filter(remoteCreeps, c => c.memory.role === 'remoteHarvester');
        if (harvesters.length < data.sources.length) {
            return { role: 'remoteHarvester', targetRoom: remoteRoomName };
        }

        // D. Prioridade 3: Reserver (Se RCL >= 3)
        if (data.reserverNeeded && room.controller && room.controller.level >= 3) {
            const reservers = _.filter(remoteCreeps, c => c.memory.role === 'reserver');
            if (reservers.length < 1) return { role: 'reserver', targetRoom: remoteRoomName };
        }

        // E. Prioridade 4: Remote Carriers (2 por harvester)
        const carriers = _.filter(remoteCreeps, c => c.memory.role === 'remoteCarrier');
        if (carriers.length < harvesters.length * 2) {
            return { role: 'remoteCarrier', targetRoom: remoteRoomName };
        }
    }

    return null;
}

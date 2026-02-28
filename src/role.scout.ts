// src/role.scout.ts
import { travelToRoom, sayAction } from './tools';

export function runScout(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
        sayAction(creep, '🔭');
        travelToRoom(creep, creep.memory.targetRoom);
    } else {
        // Chegou na sala, mapeia as fontes se ainda não estiver na memória
        if (!Memory.remoteMining) Memory.remoteMining = {};
        
        const sources = creep.room.find(FIND_SOURCES);
        const sourceIds = sources.map(s => s.id);
        
        Memory.remoteMining[creep.room.name] = {
            sources: sourceIds,
            reserverNeeded: !!creep.room.controller,
            lastScouted: Game.time
        };
        
        sayAction(creep, '✅');
        // Após escanear, o scout pode ficar parado ou ir para a próxima sala (lógica futura)
    }
}

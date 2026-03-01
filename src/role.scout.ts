// src/role.scout.ts
import { travelToRoom, sayAction } from './tools';

export function runScout(creep: Creep): void {
    const targetRoom = creep.memory.targetRoom;
    if (!targetRoom) return;

    // 1. Se já estiver na sala alvo, focar no escaneamento e não se mover mais
    if (creep.room.name === targetRoom) {
        // Se estiver na borda, dar um passo para dentro para não "piscar"
        if (creep.pos.x === 0) { creep.move(RIGHT); return; }
        if (creep.pos.x === 49) { creep.move(LEFT); return; }
        if (creep.pos.y === 0) { creep.move(BOTTOM); return; }
        if (creep.pos.y === 49) { creep.move(TOP); return; }

        sayAction(creep, '✅');

        // Escaneamento
        if (!Memory.remoteMining) Memory.remoteMining = {};
        const sources = creep.room.find(FIND_SOURCES);
        const sourceIds = sources.map(s => s.id);
        const controller = creep.room.controller;
        const isHostile = !!(controller && controller.owner && !controller.my);
        
        Memory.remoteMining[creep.room.name] = {
            sources: sourceIds,
            reserverNeeded: !!controller && !controller.owner,
            isHostile: isHostile,
            lastScouted: Game.time
        };
        
        return; // Fica parado na sala escaneando
    }

    // 2. Se não estiver na sala alvo, viajar para lá
    sayAction(creep, '🔭');
    travelToRoom(creep, targetRoom);
}

// src/role.scout.ts
import { travelToRoom, sayAction } from './tools';

export function runScout(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
        sayAction(creep, '🔭');
        travelToRoom(creep, creep.memory.targetRoom);
    } else {
        // Chegou na sala, mapeia as fontes
        if (!Memory.remoteMining) Memory.remoteMining = {};
        
        const sources = creep.room.find(FIND_SOURCES);
        const sourceIds = sources.map(s => s.id);
        
        // Verifica se a sala é hostil
        const controller = creep.room.controller;
        const isHostile = !!(controller && controller.owner && !controller.my);
        
        Memory.remoteMining[creep.room.name] = {
            sources: sourceIds,
            reserverNeeded: !!controller && !controller.owner,
            isHostile: isHostile,
            lastScouted: Game.time
        };
        
        sayAction(creep, '✅');
    }
}

// src/role.scout.ts
import { travelToRoom, sayAction } from './tools';

export function runScout(creep: Creep): void {
    const targetRoom = creep.memory.targetRoom;
    if (!targetRoom) return;

    if (creep.room.name === targetRoom) {
        if (creep.pos.x === 0) { creep.move(RIGHT); return; }
        if (creep.pos.x === 49) { creep.move(LEFT); return; }
        if (creep.pos.y === 0) { creep.move(BOTTOM); return; }
        if (creep.pos.y === 49) { creep.move(TOP); return; }

        sayAction(creep, '✅');

        if (!Memory.remoteMining) Memory.remoteMining = {};
        
        const sources = creep.room.find(FIND_SOURCES);
        const sourceIds = sources.map(s => s.id);
        const sourcePositions = sources.map(s => ({ x: s.pos.x, y: s.pos.y }));
        
        const controller = creep.room.controller;
        
        // Verificação aprimorada de hostilidade
        const hasHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).length > 0;
        const hasHostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: (s) => s.owner && s.owner.username !== 'Invader' && s.owner.username !== 'Source Keeper'
        }).length > 0;
        const isControllerHostile = !!(controller && controller.owner && !controller.my);
        
        const isHostile = hasHostileCreeps || hasHostileStructures || isControllerHostile;
        
        Memory.remoteMining[creep.room.name] = {
            sources: sourceIds,
            sourcePositions: sourcePositions,
            reserverNeeded: !!controller && !controller.owner,
            isHostile: isHostile,
            lastScouted: Game.time
        };
        
        return; 
    }

    sayAction(creep, '🔭');
    travelToRoom(creep, targetRoom);
}

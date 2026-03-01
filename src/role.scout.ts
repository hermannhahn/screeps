// src/role.scout.ts
import { travelToRoom, sayAction } from './tools';

export function runScout(creep: Creep): void {
    const targetRoom = creep.memory.targetRoom;
    if (!targetRoom) return;

    // LOG DE RASTREAMENTO (Para depuração autônoma)
    if (Game.time % 5 === 0) {
        console.log(`Scout ${creep.name}: In ${creep.room.name}, target ${targetRoom}, pos ${creep.pos.x},${creep.pos.y}`);
    }

    // Primeiro garantimos que ele chegue e saia da borda usando a ferramenta centralizada
    if (travelToRoom(creep, targetRoom)) return;

    // Se chegou aqui, travelToRoom retornou false, o que significa que já está na sala e fora da borda
    if (creep.room.name === targetRoom) {
        sayAction(creep, '✅');
        if (!Memory.remoteMining) Memory.remoteMining = {};
        
        const data = Memory.remoteMining[creep.room.name];
        // Atualiza a memória se for a primeira vez ou se já passou um tempo (100 ticks)
        if (!data || !data.lastScouted || Game.time - data.lastScouted > 100) {
            console.log(`Scout ${creep.name}: Scanning room ${creep.room.name}...`);
            const sources = creep.room.find(FIND_SOURCES);
            const sourceIds = sources.map(s => s.id);
            const sourcePositions = sources.map(s => ({ x: s.pos.x, y: s.pos.y }));
            
            const controller = creep.room.controller;
            const hasHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).length > 0;
            const hasHostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES).length > 0;
            const isControllerHostile = !!(controller && controller.owner && !controller.my);
            const isHostile = hasHostileCreeps || hasHostileStructures || isControllerHostile;
            
            if (isHostile) console.log(`Scout ${creep.name}: Room ${creep.room.name} marked as HOSTILE!`);
            else if (data && data.isHostile) console.log(`Scout ${creep.name}: Room ${creep.room.name} is now SAFE.`);

            Memory.remoteMining[creep.room.name] = {
                sources: sourceIds,
                sourcePositions: sourcePositions,
                reserverNeeded: !!controller && !controller.owner,
                isHostile: isHostile,
                lastScouted: Game.time
            };
        }
        
        // Se a sala já foi escaneada e não há nada pra fazer aqui, o scout pode ficar como vigia
        return; 
    }

    sayAction(creep, '🔭');
    travelToRoom(creep, targetRoom);
}

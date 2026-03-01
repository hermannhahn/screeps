// src/role.remoteHarvester.ts
import { travelToRoom, sayAction, handleDefensiveState } from './tools';

export function runRemoteHarvester(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    // --- SISTEMA DEFENSIVO ---
    if (handleDefensiveState(creep)) return;

    // Verifica se a sala alvo ainda é considerada segura na memória
    if (Memory.remoteMining && Memory.remoteMining[creep.memory.targetRoom] && Memory.remoteMining[creep.memory.targetRoom].isHostile) {
        sayAction(creep, '⚠️');
        // Se a sala ficou hostil, volta para a homeRoom para ser reciclado ou aguardar
        if (creep.memory.homeRoom) travelToRoom(creep, creep.memory.homeRoom);
        return;
    }

    if (creep.room.name !== creep.memory.targetRoom) {
        sayAction(creep, '🚚');
        travelToRoom(creep, creep.memory.targetRoom);
    } else {
        if (!creep.memory.sourceId) {
            const sources = creep.room.find(FIND_SOURCES);
            if (sources.length > 0) creep.memory.sourceId = sources[0].id;
        }

        const source = Game.getObjectById(creep.memory.sourceId as Id<Source>);
        if (source) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                sayAction(creep, '⛏️');
            }
        }
    }
}

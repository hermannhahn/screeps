// src/role.remoteHarvester.ts
import { travelToRoom, sayAction, handleDefensiveState } from './tools';

export function runRemoteHarvester(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    if (handleDefensiveState(creep)) return;

    const data = Memory.remoteMining ? Memory.remoteMining[creep.memory.targetRoom] : null;
    if (data && data.isHostile) {
        sayAction(creep, '⚠️');
        // Se a sala é hostil, volta para o centro da homeRoom e espera a morte natural
        const spawn = Game.rooms[creep.memory.homeRoom || '']?.find(FIND_MY_SPAWNS)[0];
        if (spawn) creep.moveTo(spawn);
        else if (creep.memory.homeRoom) travelToRoom(creep, creep.memory.homeRoom);
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

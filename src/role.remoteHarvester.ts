// src/role.remoteHarvester.ts
import { travelToRoom, sayAction } from './tools';

export function runRemoteHarvester(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
        sayAction(creep, '🚚');
        travelToRoom(creep, creep.memory.targetRoom);
    } else {
        // Na sala alvo, busca a fonte atribuída
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

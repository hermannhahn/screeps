// src/role.reserver.ts
import { travelToRoom, sayAction } from './tools';

export function runReserver(creep: Creep): void {
    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
        sayAction(creep, '🚀');
        travelToRoom(creep, creep.memory.targetRoom);
    } else {
        const controller = creep.room.controller;
        if (controller) {
            if (creep.reserveController(controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            } else {
                sayAction(creep, '🔒');
            }
        }
    }
}

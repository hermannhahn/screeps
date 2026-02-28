// src/role.remoteCarrier.ts
import { travelToRoom, sayAction } from './tools';

export function runRemoteCarrier(creep: Creep): void {
    if (!creep.memory.targetRoom || !creep.memory.homeRoom) return;

    // Se estiver vazio, vai para a sala remota buscar
    if (creep.store.getUsedCapacity() === 0) {
        if (creep.room.name !== creep.memory.targetRoom) {
            sayAction(creep, '🏃');
            travelToRoom(creep, creep.memory.targetRoom);
        } else {
            // Na sala remota, busca drops ou containers
            const target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (target) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else {
                    sayAction(creep, '📦');
                }
            }
        }
    } 
    // Se estiver cheio, volta para a sala principal depositar
    else {
        if (creep.room.name !== creep.memory.homeRoom) {
            sayAction(creep, '💰');
            travelToRoom(creep, creep.memory.homeRoom);
        } else {
            // Na sala principal, deposita no spawn/storage
            const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                               s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }) as AnyStructure;
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else {
                    sayAction(creep, '📥');
                }
            }
        }
    }
}

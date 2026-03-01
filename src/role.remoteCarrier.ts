// src/role.remoteCarrier.ts
import { travelToRoom, sayAction, handleDefensiveState } from './tools';

export function runRemoteCarrier(creep: Creep): void {
    if (!creep.memory.targetRoom || !creep.memory.homeRoom) return;

    if (handleDefensiveState(creep)) return;

    const data = Memory.remoteMining ? Memory.remoteMining[creep.memory.targetRoom] : null;
    if (data && data.isHostile && creep.store.getUsedCapacity() === 0) {
        sayAction(creep, '⚠️');
        // Volta para casa e espera a morte natural
        const spawn = Game.rooms[creep.memory.homeRoom || '']?.find(FIND_MY_SPAWNS)[0];
        if (spawn) creep.moveTo(spawn);
        else travelToRoom(creep, creep.memory.homeRoom);
        return;
    }

    if (creep.store.getUsedCapacity() === 0) {
        if (creep.room.name !== creep.memory.targetRoom) {
            sayAction(creep, '🏃');
            travelToRoom(creep, creep.memory.targetRoom);
        } else {
            // Tenta encontrar energia caída perto de um harvester
            const harvesters = _.filter(Game.creeps, c => c.memory.targetRoom === creep.room.name && c.memory.role === 'remoteHarvester');
            let target: any = null;
            
            for (const h of harvesters) {
                const dropped = h.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
                    filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
                })[0];
                if (dropped) { target = dropped; break; }
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
                });
            }

            if (!target) {
                target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100
                });
            }

            if (target) {
                const res = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
                if (res === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    sayAction(creep, '📦');
                }
            }
        }
    } 
    else {
        if (creep.room.name !== creep.memory.homeRoom) {
            sayAction(creep, '💰');
            travelToRoom(creep, creep.memory.homeRoom);
        } else {
            // Se estiver na homeRoom mas na borda, move para o centro
            if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
                if (spawn) creep.moveTo(spawn);
            }

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

import { isTargetAvailable, getEnergyAmount, handleDefensiveState, sayAction, travelToRoom } from './tools';

export function runRepairer(creep: Creep): void {
    if (handleDefensiveState(creep)) return;

    if (creep.memory.repairing && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.repairing = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.repairing && creep.store.getFreeCapacity() === 0) {
        creep.memory.repairing = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.repairing) {
        if (!creep.memory.targetId) {
            // 1. Busca estruturas CRÍTICAS na sala atual (< 20% vida)
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax * 0.2 && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
            });

            // 2. Busca estradas e containers em salas vizinhas
            if (!target && Memory.remoteMining) {
                const remoteRooms = Object.keys(Memory.remoteMining);
                for (const roomName of remoteRooms) {
                    const remoteRoom = Game.rooms[roomName];
                    if (remoteRoom) {
                        const damagedRemotes = remoteRoom.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.8
                        });
                        if (damagedRemotes.length > 0) {
                            target = creep.pos.findClosestByRange(damagedRemotes);
                            if (target) break;
                        }
                    } else {
                        // Se não temos visão, mas sabemos que há estradas lá (via memória ou scout)
                        // O repairer pode decidir ir até lá patrulhar
                        const data = Memory.remoteMining[roomName];
                        if (!data.isHostile && Game.time % 100 === 0) { // Patrulha periódica
                             creep.memory.targetRoom = roomName;
                             break;
                        }
                    }
                }
            }

            // 3. Manutenção preventiva geral na home room
            if (!target) {
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
                });
            }

            if (target) creep.memory.targetId = target.id;
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<Structure>);
            if (target) {
                if (target.pos.roomName !== creep.room.name) {
                    travelToRoom(creep, target.pos.roomName);
                } else {
                    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' }, reusePath: 10 });
                    } else {
                        sayAction(creep, '🔧');
                    }
                }
            } else {
                delete creep.memory.targetId;
            }
        } else if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
             travelToRoom(creep, creep.memory.targetRoom);
        } else {
            // Se não há nada para reparar, ajuda no upgrade
            if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller!);
            }
        }
    } else {
        // Coleta de energia
        if (!creep.memory.targetId) {
            const storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                creep.memory.targetId = storage.id;
            } else {
                const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
                });
                if (container) creep.memory.targetId = container.id;
            }
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target) {
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                delete creep.memory.targetId;
            }
        }
    }
}

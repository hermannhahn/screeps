// src/role.builder.ts
import { isTargetAvailable, getEnergyAmount, handleDefensiveState, sayAction, travelToRoom } from './tools';

export function runBuilder(creep: Creep): void {
    if (handleDefensiveState(creep)) return;

    if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.building = false;
        delete creep.memory.targetId;
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
        creep.memory.building = true;
        delete creep.memory.targetId;
    }

    if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (!target) {
            delete creep.memory.targetId;
        } else if (target instanceof ConstructionSite) {
            // OK
        } else if (getEnergyAmount(target) === 0) {
            delete creep.memory.targetId;
        }
    }

    if (creep.memory.building) {
        if (!creep.memory.targetId) {
            let site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            
            if (!site) {
                const globalSites = Object.values(Game.constructionSites);
                if (globalSites.length > 0) {
                    // Busca manual para evitar problemas com Lodash
                    let minVal = Infinity;
                    for (const s of globalSites) {
                        let dist: number;
                        if (s.pos.roomName === creep.room.name) dist = creep.pos.getRangeTo(s);
                        else dist = Game.map.getRoomLinearDistance(creep.room.name, s.pos.roomName) * 50;
                        
                        if (dist < minVal) {
                            minVal = dist;
                            site = s;
                        }
                    }
                }
            }
            
            if (site) creep.memory.targetId = site.id;
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<ConstructionSite>);
            if (target) {
                if (target.pos.roomName !== creep.room.name) {
                    travelToRoom(creep, target.pos.roomName);
                } else {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
                    } else {
                        sayAction(creep, '🔨');
                    }
                }
            } else {
                delete creep.memory.targetId;
            }
        } else {
            const homeRoomName = creep.memory.homeRoom || '';
            if (creep.room.name !== homeRoomName) {
                travelToRoom(creep, homeRoomName);
            } else if (creep.room.controller) {
                if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 10 });
                } else {
                    sayAction(creep, '⚡');
                }
            }
        }
    } else {
        if (!creep.memory.targetId) {
            if (creep.memory.homeRoom && creep.room.name !== creep.memory.homeRoom) {
                travelToRoom(creep, creep.memory.homeRoom);
                return;
            }

            const storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0 && isTargetAvailable(creep, storage)) {
                creep.memory.targetId = storage.id;
            }
            if (!creep.memory.targetId) {
                const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 50 && isTargetAvailable(creep, s)
                });
                if (container) creep.memory.targetId = container.id;
            }
            if (!creep.memory.targetId) {
                const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50 && isTargetAvailable(creep, r)
                });
                if (drop) creep.memory.targetId = drop.id;
            }
        }

        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId as Id<any>);
            if (target) {
                const res = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
                if (res === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
                } else {
                    sayAction(creep, '📦');
                }
            } else {
                delete creep.memory.targetId;
            }
        } else {
            sayAction(creep, '💤');
        }
    }
}

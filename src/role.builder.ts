// src/role.builder.ts
export function runBuilder(creep: Creep): void {
    if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.building = false;
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
        creep.memory.building = true;
    }

    if (creep.memory.building) {
        // Prioridade 1: Construir
        const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            // Prioridade 2: Upgrade
            if (creep.upgradeController(creep.room.controller!) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller!, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    } else {
        // Obter energia
        // 1. Retirar de containers/links
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK) && 
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 50
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
        } else {
            // 2. Pegar drops
            const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(drop);
                }
            } else {
                // 3. Harvestar (último recurso)
                const source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        }
    }
}

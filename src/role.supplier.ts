// src/role.supplier.ts
export function runSupplier(creep: Creep): void {
    const room = creep.room;

    if (creep.store.getUsedCapacity() === 0) {
        // Coleta
        const sources = room.find(FIND_SOURCES);
        const sourceContainers = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                           sources.some(source => s.pos.inRangeTo(source, 3)) &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });

        if (sourceContainers.length > 0) {
            const target = creep.pos.findClosestByPath(sourceContainers);
            if (target && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                console.log(`${creep.name}: Indo coletar de container em ${target.pos}`);
                creep.moveTo(target);
            }
        } else {
            const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (drop) {
                if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
                    console.log(`${creep.name}: Indo pegar drop em ${drop.pos}`);
                    creep.moveTo(drop);
                }
            } else {
                console.log(`${creep.name}: Nada para coletar.`);
            }
        }
    } else {
        // Entrega
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) as AnyStructure;

        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                console.log(`${creep.name}: Indo entregar em ${target.structureType}`);
                creep.moveTo(target);
            }
        } else {
            console.log(`${creep.name}: Nada para entregar, aguardando.`);
        }
    }
}

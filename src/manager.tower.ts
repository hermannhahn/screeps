import _ from 'lodash';

export const managerTower = {
    run(room: Room): void {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_TOWER
        }) as StructureTower[];

        for (const tower of towers) {
            const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.attack(closestHostile);
            } else {
                const damagedStructures = room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax / 2 && structure.hits < structure.hitsMax
                });

                if (damagedStructures.length > 0) {
                    damagedStructures.sort((a, b) => a.hits - b.hits);
                    tower.repair(damagedStructures[0]);
                }
            }
        }
    }
};
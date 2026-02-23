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
                    filter: (structure) => {
                        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
                            return structure.hits < 10000; // Repara Walls e Ramparts até 10.000 hits
                        }
                        return structure.hits < structure.hitsMax * 0.9; // Repara outras estruturas até 90% da vida máxima
                    }
                });

                if (damagedStructures.length > 0) {
                    damagedStructures.sort((a, b) => a.hits - b.hits);
                    tower.repair(damagedStructures[0]);
                }
            }
        }
    }
};
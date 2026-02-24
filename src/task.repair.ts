import _ from 'lodash';

const taskRepair = {
    run: function(creep: Creep): boolean {
        let target: AnyStructure | null = null;

        // Try to recover target from memory
        if (creep.memory.targetRepairId) {
            target = Game.getObjectById(creep.memory.targetRepairId as Id<AnyStructure>);
            // If target is fully repaired or gone, clear it
            if (!target || target.hits >= target.hitsMax) {
                delete creep.memory.targetRepairId;
                target = null;
            }
        }

        if (!target) {
            const targetedByOthers = _.compact(_.map(Game.creeps, (c: Creep) => {
                if (c.id !== creep.id && c.room.name === creep.room.name && c.memory.targetRepairId) {
                    return c.memory.targetRepairId;
                }
                return null;
            })) as Id<any>[];

            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    const isDamaged = structure.hits < structure.hitsMax * 0.6;
                    const isNotWallOrRampart = structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART;
                    const isWallOrRampartLow = (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) && structure.hits < 10000;
                    
                    return isDamaged && (isNotWallOrRampart || isWallOrRampartLow) && !targetedByOthers.includes(structure.id);
                }
            });

            if (targets.length > 0) {
                targets.sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));
                target = targets[0];
                creep.memory.targetRepairId = target.id;
            }
        }

        if (target) {
            if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return true;
        }
        return false;
    }
};

export default taskRepair;

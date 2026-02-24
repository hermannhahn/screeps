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
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax) && 
                           (structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART || structure.hits < 10000);
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

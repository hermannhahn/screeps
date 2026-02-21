const taskRepair = {
    run: function(creep: Creep): boolean {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax) && 
                       (structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART || structure.hits < 10000);
            }
        });

        if (targets.length > 0) {
            targets.sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));
            
            if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return true;
        }
        return false;
    }
};

export default taskRepair;

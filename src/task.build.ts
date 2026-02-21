const taskBuild = {
    run: function(creep: Creep): boolean {
        const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        let target: ConstructionSite | null = null;

        if (targets.length > 0) {
            targets.sort((a, b) => {
                const progressA = a.progress / a.progressTotal;
                const progressB = b.progress / b.progressTotal;
                if (progressA !== progressB) {
                    return progressB - progressA;
                }
                return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
            });
            target = targets[0];
        }

        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true;
        }
        return false;
    }
};

export default taskBuild;

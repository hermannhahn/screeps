const taskBuild = {
    run: function(creep: Creep): boolean {
        let target: ConstructionSite | null = null;

        if (creep.memory.targetBuildId) {
            target = Game.getObjectById(creep.memory.targetBuildId as Id<ConstructionSite>);
            if (!target) {
                delete creep.memory.targetBuildId;
            }
        }

        if (!target) {
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
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
                creep.memory.targetBuildId = target.id;
            }
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

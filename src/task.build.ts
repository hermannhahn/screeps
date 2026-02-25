import _ from 'lodash';
import { getIncomingWork } from './utils.creep';

const taskBuild = {
    run: function(creep: Creep): boolean {
        let target = creep.memory.targetBuildId ? Game.getObjectById(creep.memory.targetBuildId as Id<ConstructionSite>) : null;

        if (!target) {
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (cs) => {
                    return getIncomingWork(cs.id, 'targetBuildId') < 10;
                }
            });

            if (targets.length > 0) {
                target = _.maxBy(targets, (t: ConstructionSite) => t.progress / t.progressTotal) || null;
                if (target) creep.memory.targetBuildId = target.id;
            }
        }

        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            } else {
                creep.say('🚧');
            }
            return true;
        }
        return false;
    }
};

export default taskBuild;

import _ from 'lodash';
import { getIncomingWork } from './utils.creep';

const taskBuild = {
    run: function(creep: Creep): boolean {
        let target = creep.memory.targetBuildId ? Game.getObjectById(creep.memory.targetBuildId as Id<ConstructionSite>) : null;

        // Se já tem um alvo, mas existe algo MUITO próximo (range 3), vamos reavaliar para priorizar o trabalho local
        if (target && !creep.pos.inRangeTo(target, 3)) {
            const nearbyCS = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
                filter: (cs) => getIncomingWork(cs.id, 'targetBuildId') < 10
            });
            if (nearbyCS.length > 0) {
                delete creep.memory.targetBuildId;
                target = null;
            }
        }

        if (!target) {
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES, {
                filter: (cs) => {
                    return getIncomingWork(cs.id, 'targetBuildId') < 10;
                }
            });

            if (targets.length > 0) {
                target = creep.pos.findClosestByPath(targets) || null;
                if (target) {
                    creep.memory.targetBuildId = target.id;
                    creep.say('🚧');
                }
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

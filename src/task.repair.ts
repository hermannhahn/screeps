import _ from 'lodash';
import { getIncomingWork } from './utils.creep';

const taskRepair = {
    run: function(creep: Creep): boolean {
        let target = creep.memory.targetRepairId ? Game.getObjectById(creep.memory.targetRepairId as Id<AnyStructure>) : null;

        if (target && target.hits >= target.hitsMax) {
            delete creep.memory.targetRepairId;
            target = null;
        }

        if (!target) {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    const isDamaged = s.hits < s.hitsMax * 0.8;
                    const isWallOrRampart = s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART;
                    const wallThreshold = 30000;
                    
                    if (isWallOrRampart && s.hits >= wallThreshold) return false;
                    if (!isDamaged && !isWallOrRampart) return false;

                    const incomingWork = getIncomingWork(s.id, 'targetRepairId');
                    return isWallOrRampart ? incomingWork < 10 : incomingWork === 0;
                }
            });

            if (targets.length > 0) {
                target = _.minBy(targets, (s: AnyStructure) => s.hits / s.hitsMax) || null;
                if (target) creep.memory.targetRepairId = target.id;
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

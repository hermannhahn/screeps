import _ from 'lodash';
import { findPrioritizedHostileCreep } from './utils.combat';

const roleGuard = {
    run: function(creep: Creep) {
        const target = findPrioritizedHostileCreep(creep);

        if (target) {
            if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // Se não houver inimigos, mover-se para perto do spawn ou um ponto de rally defensivo
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (spawn) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};

export default roleGuard;
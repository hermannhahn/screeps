import _ from 'lodash';

const roleDefender = {
    run: function(creep: Creep) {
        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];

        const mainHostileTarget = hostiles.length > 0 ? _.sortBy(hostiles, h => (spawn ? spawn.pos.getRangeTo(h) : 0))[0] : null;

        // Simplified logic: engage directly if hostile, else move to spawn
        if (mainHostileTarget) {
            if (creep.memory.defenderType === 'ranged') {
                if (creep.rangedAttack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5, range: 3 });
                }
            } else if (creep.memory.defenderType === 'tank') {
                if (creep.attack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#0000ff' }, reusePath: 5, range: 1 });
                }
            }
        } else {
            if (spawn && !creep.pos.isEqualTo(spawn.pos)) {
                creep.moveTo(spawn.pos, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
            }
        }
    }
};

export default roleDefender;

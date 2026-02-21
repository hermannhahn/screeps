import _ from 'lodash';

const roleDefender = {
    run: function(creep: Creep) {
        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];

        const mainHostileTarget = hostiles.length > 0 ? _.sortBy(hostiles, h => (spawn ? spawn.pos.getRangeTo(h) : 0))[0] : null;

        let rallyPoint: RoomPosition | null = null;
        if (mainHostileTarget && spawn) {
            const pathToHostile = PathFinder.search(
                spawn.pos,
                { pos: mainHostileTarget.pos, range: 1 },
                { maxRooms: 1 }
            ).path;

            const pathLength = pathToHostile.length;
            const rallyPointIndex = Math.max(0, pathLength - 10);
            rallyPoint = pathToHostile[rallyPointIndex];
        } else if (spawn) {
            rallyPoint = spawn.pos;
        } else {
            return;
        }

        if (!creep.memory.state) {
            creep.memory.state = 'GATHERING';
        }

        if (hostiles.length > 0) {
            const allDefenders = _.filter(Game.creeps, (c) => c.memory && c.memory.role === 'defender' && c.room.name === creep.room.name);
            const defendersAtRallyPoint = _.filter(allDefenders, (d) => rallyPoint && d.pos.getRangeTo(rallyPoint) <= 2).length;

            if (creep.memory.state === 'GATHERING') {
                if (allDefenders.length === 3 && defendersAtRallyPoint === 3) {
                    creep.memory.state = 'ENGAGING';
                    creep.say('ENGAGE');
                } else if (rallyPoint && !creep.pos.isEqualTo(rallyPoint)) {
                    creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 5 });
                    creep.say('GATHER');
                } else {
                    creep.say('WAIT');
                }
            }

            if (creep.memory.state === 'ENGAGING') {
                if (mainHostileTarget) {
                    if (creep.rangedAttack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5, range: 3 });
                    }
                    creep.say('ATTACK!');
                } else {
                    creep.memory.state = 'GATHERING';
                    creep.say('NO TARGET');
                }
            }
        } else {
            creep.memory.state = 'GATHERING';
            if (rallyPoint && !creep.pos.isEqualTo(rallyPoint)) {
                creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
                creep.say('IDLE');
            }
        }
    }
};

export default roleDefender;

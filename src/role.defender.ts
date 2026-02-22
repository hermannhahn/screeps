import _ from 'lodash';

const roleDefender = {
    run: function(creep: Creep) {
        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];

        // Determine main hostile target, prioritize closest to spawn
        const mainHostileTarget = hostiles.length > 0 ? _.sortBy(hostiles, h => (spawn ? spawn.pos.getRangeTo(h) : 0))[0] : null;

        // Calculate rally point: 5 blocks from hostile target, towards spawn
        let rallyPoint: RoomPosition | null = null;
        if (mainHostileTarget && spawn) {
            // Find a position 5 units away from the hostile, towards the spawn
            const pathFromHostileToSpawn = PathFinder.search(
                mainHostileTarget.pos,
                { pos: spawn.pos, range: 0 }, // Target is spawn, range 0 to get a path directly to it
                { maxRooms: 1 }
            ).path;
            const rallyPointIndex = Math.min(pathFromHostileToSpawn.length - 1, 5); // 5 blocks away from hostile
            rallyPoint = pathFromHostileToSpawn[rallyPointIndex];
        } else if (spawn) {
            rallyPoint = spawn.pos; // Default rally point is spawn if no hostiles
        } else {
            return; // No spawn, no hostiles, defender can't do much
        }

        // Initialize state if not set
        if (!creep.memory.state) {
            creep.memory.state = 'GATHERING';
        }

        if (hostiles.length > 0) { // If there are hostiles
            // Count active defenders (ranged and tank)
            const allDefenders = _.filter(Game.creeps, (c) => c.memory.role === 'defender' && c.room.name === creep.room.name);
            const defendersRanged = _.filter(allDefenders, (c) => c.memory.defenderType === 'ranged');
            const defendersTank = _.filter(allDefenders, (c) => c.memory.defenderType === 'tank');

            // Check if team is complete (1 Ranged, 2 Tanks)
            const teamComplete = defendersRanged.length >= 1 && defendersTank.length >= 2;
            
            // Check if all team members are at the rally point
            const allAtRallyPoint = rallyPoint && _.every(allDefenders, (d) => rallyPoint && d.pos.getRangeTo(rallyPoint) <= 2);

            if (creep.memory.state === 'GATHERING') {
                if (teamComplete && allAtRallyPoint) {
                    creep.memory.state = 'ENGAGING';
                } else if (rallyPoint && !creep.pos.isEqualTo(rallyPoint)) {
                    creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 5 });
                } else {
                }
            } else if (creep.memory.state === 'ENGAGING') {
                if (mainHostileTarget) {
                    if (creep.memory.defenderType === 'ranged') {
                        // Ranged: Stay at range 3 from hostile, attack
                        if (creep.rangedAttack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5, range: 3 });
                        }
                    } else if (creep.memory.defenderType === 'tank') {
                        // Tank: Move into range 1, attack
                        if (creep.attack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#0000ff' }, reusePath: 5, range: 1 });
                        }
                    }
                } else {
                    // No more hostiles, return to gathering state
                    creep.memory.state = 'GATHERING';
                }
            }
        } else { // No hostiles in room
            // If no hostiles, return to spawn or rally point
            creep.memory.state = 'GATHERING'; // Reset state
            if (rallyPoint && !creep.pos.isEqualTo(rallyPoint)) {
                creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
            } else if (spawn && !creep.pos.isEqualTo(spawn.pos)) { // Fallback to spawn if no rally point defined
                creep.moveTo(spawn.pos, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 });
            } else {
            }
        }
    }
};

export default roleDefender;

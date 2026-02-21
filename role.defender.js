const roleDefender = {
  /** @param {Creep} creep **/
  run: function(creep) {
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];

    // Define rally point (e.g., 1 tile to the right of the spawn)
    if (!creep.room.memory.defenderRallyPoint && spawn) {
        creep.room.memory.defenderRallyPoint = { x: spawn.pos.x + 1, y: spawn.pos.y, roomName: spawn.room.name };
    }
    const rallyPoint = creep.room.memory.defenderRallyPoint ? new RoomPosition(creep.room.memory.defenderRallyPoint.x, creep.room.memory.defenderRallyPoint.y, creep.room.memory.defenderRallyPoint.roomName) : spawn.pos;

    // State management
    if (!creep.memory.state) {
      creep.memory.state = 'GATHERING';
    }

    if (hostiles.length > 0) {
      // Find all defenders in the room
      const allDefenders = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'defender' && c.room.name == creep.room.name);
      // Count defenders near the rally point
      const defendersAtRallyPoint = _.filter(allDefenders, (d) => d.pos.getRangeTo(rallyPoint) <= 2).length;

      // Debugging: Log state transition conditions
      // console.log(`Defender ${creep.name} - State: ${creep.memory.state}, Hostiles: ${hostiles.length}, AllDefenders: ${allDefenders.length}, AtRally: ${defendersAtRallyPoint}`);

      if (creep.memory.state === 'GATHERING') {
        // Only engage if there are 3 defenders total AND all 3 are at the rally point
        if (allDefenders.length === 3 && defendersAtRallyPoint === 3) {
          creep.memory.state = 'ENGAGING';
          creep.say('ENGAGE');
        } else if (!creep.pos.isEqualTo(rallyPoint)) {
          // Move to rally point
          creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 5 }); // Lower reusePath
          creep.say('GATHER');
        } else {
          creep.say('WAIT');
        }
      } 
      
      if (creep.memory.state === 'ENGAGING') {
        // Determine a consistent hostile target for all defenders
        const mainHostileTarget = _.sortBy(hostiles, h => creep.pos.getRangeTo(h))[0]; // Closest hostile for all defenders

        if (mainHostileTarget) {
          // Determine the lead defender (closest to the mainHostileTarget)
          const leader = _.min(allDefenders, (d) => d.pos.getRangeTo(mainHostileTarget));

          if (creep.id === leader.id) {
            // This is the leader, move directly to hostile
            if (creep.attack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
              creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5 }); // Lower reusePath
            }
            creep.say('LEADER');
          } else {
            // This is a follower, move directly to the leader's position
            if (creep.attack(mainHostileTarget) === ERR_NOT_IN_RANGE || creep.rangedAttack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
                if (!creep.pos.isEqualTo(leader.pos)) { // Only move if not already on leader's position
                    creep.moveTo(leader.pos, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5 }); // Lower reusePath
                }
            }
            creep.say('FOLLOW');
          }

          // If in range, attack 
          if (creep.attack(mainHostileTarget) === OK) { /* attack should happen here */ }
          if (creep.rangedAttack(mainHostileTarget) === OK) { /* ranged attack if applicable */ }
        } else {
          // No mainHostileTarget found (hostiles might have disappeared)
          creep.memory.state = 'GATHERING'; // Revert to gathering if target disappeared
          creep.say('NO TARGET');
        }
      }
    } else {
      // No hostiles, return to rally point or guard post
      creep.memory.state = 'GATHERING'; // Reset state
      if (!creep.pos.isEqualTo(rallyPoint)) {
        creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 5 }); // Lower reusePath
        creep.say('IDLE');
      }
    }
  }
};

module.exports = roleDefender;

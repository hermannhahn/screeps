const roleDefender = {
  /** @param {Creep} creep **/
  run: function(creep) {
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];

    // Determine a consistent hostile target for all defenders
    const mainHostileTarget = hostiles.length > 0 ? _.sortBy(hostiles, h => (spawn ? spawn.pos.getRangeTo(h) : 0))[0] : null;

    // Define dynamic rally point if mainHostileTarget exists
    let rallyPoint;
    if (mainHostileTarget && spawn) {
        // Calculate a path from spawn to the hostile target
        const pathToHostile = PathFinder.search(
            spawn.pos, 
            { pos: mainHostileTarget.pos, range: 1 }, 
            { maxRooms: 1 } // Stay within the same room for rally point
        ).path;

        // Pick a point on the path that is roughly 10 tiles away from the hostile
        // Or closer if the path is shorter than 10.
        const pathLength = pathToHostile.length;
        const rallyPointIndex = Math.max(0, pathLength - 10);
        rallyPoint = pathToHostile[rallyPointIndex];
    } else if (spawn) {
        // If no hostiles or path, rally near spawn
        rallyPoint = spawn.pos;
    } else {
        // Fallback if no spawn or hostiles (shouldn't happen for active creeps)
        return; 
    }

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
        if (mainHostileTarget) {
          // All defenders directly move to and attack the mainHostileTarget
          if (creep.attack(mainHostileTarget) === ERR_NOT_IN_RANGE) {
            creep.moveTo(mainHostileTarget, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 5 });
          }
          creep.say('ATTACK!');
        } else {
          // Hostile disappeared while engaging
          creep.memory.state = 'GATHERING'; 
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

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

      if (creep.memory.state === 'GATHERING') {
        if (defendersAtRallyPoint < 3) {
          // Move to rally point
          if (!creep.pos.isEqualTo(rallyPoint)) {
            creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 50 });
            creep.say('GATHER');
          } else {
            creep.say('WAIT');
          }
        } else {
          // Enough defenders gathered, engage
          creep.memory.state = 'ENGAGING';
          creep.say('ENGAGE');
        }
      } 
      
      if (creep.memory.state === 'ENGAGING') {
        const closestHostile = creep.pos.findClosestByPath(hostiles); // Find closest hostile for engagement
        if (closestHostile) {
          // Attack logic
          if (creep.attack(closestHostile) === ERR_NOT_IN_RANGE) {
            creep.moveTo(closestHostile, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 50 });
          }
          creep.say('ATTACK');
        } else {
            // No closest hostile found (shouldn't happen if hostiles.length > 0)
            creep.memory.state = 'GATHERING'; // Revert to gathering if target disappeared
            creep.say('NO TARGET');
        }
      }
    } else {
      // No hostiles, return to rally point or guard post
      creep.memory.state = 'GATHERING'; // Reset state
      if (!creep.pos.isEqualTo(rallyPoint)) {
        creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
        creep.say('IDLE');
      }
    }
  }
};

module.exports = roleDefender;

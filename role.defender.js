const roleDefender = {
  /** @param {Creep} creep **/
  run: function(creep) {
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);

    if (hostiles.length > 0) {
      // Find the closest hostile creep
      const closestHostile = creep.pos.findClosestByPath(hostiles);

      if (closestHostile) {
        // Attack logic
        if (creep.attack(closestHostile) === ERR_NOT_IN_RANGE) {
          creep.moveTo(closestHostile, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 50 });
        }
      }
    } else {
      // If no hostiles, return to a guard post (e.g., near the spawn)
      const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        if (!creep.pos.isEqualTo(spawn.pos)) {
          creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
        }
      }
      // TODO: Implement recycling if defenders are not needed for too long
    }
  }
};

module.exports = roleDefender;

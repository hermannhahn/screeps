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
                // Only engage if there are 3 defenders total AND all 3 are at the rally point
                if (allDefenders.length === 3 && defendersAtRallyPoint === 3) {
                  creep.memory.state = 'ENGAGING';
                  creep.say('ENGAGE');
                } else if (!creep.pos.isEqualTo(rallyPoint)) {
                  // Move to rally point
                  creep.moveTo(rallyPoint, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 50 });
                  creep.say('GATHER');
                } else {
                  creep.say('WAIT');
                }
              }       
      if (creep.memory.state === 'ENGAGING') {
        const closestHostile = creep.pos.findClosestByPath(hostiles);
        if (closestHostile) {
          const allDefenders = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'defender' && c.room.name == creep.room.name);
          
          // Determine the lead defender (e.g., based on ID - lowest ID for consistency)
          const leader = _.min(allDefenders, 'id'); 

          if (creep.id === leader.id) {
            // This is the leader, move directly to hostile
            if (creep.attack(closestHostile) === ERR_NOT_IN_RANGE) {
              creep.moveTo(closestHostile, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 50 });
            }
            creep.say('LEADER');
          } else {
            // This is a follower
            // Try to move to a position adjacent to the leader that is also closer to the hostile.
            let targetPos = closestHostile.pos; // Default to hostile's position

            if (leader) {
                // Find a position adjacent to the leader that is passable and not occupied by another creep
                const adjacentToLeader = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const pos = new RoomPosition(leader.pos.x + dx, leader.pos.y + dy, leader.pos.roomName);
                        if (pos.isWalkable(creep) && !pos.hasCreep()) {
                            adjacentToLeader.push(pos);
                        }
                    }
                }
                
                // Prioritize positions that are closer to the hostile
                if (adjacentToLeader.length > 0) {
                    const closestAdjacentToHostile = _.min(adjacentToLeader, (p) => p.getRangeTo(closestHostile));
                    if (closestAdjacentToHostile) {
                        targetPos = closestAdjacentToHostile;
                    }
                } else {
                    // Fallback: if no good adjacent spots, just try to get closer to the leader
                    targetPos = leader.pos;
                }
            }

            if (creep.attack(closestHostile) === ERR_NOT_IN_RANGE || creep.rangedAttack(closestHostile) === ERR_NOT_IN_RANGE) {
                if (!creep.pos.isEqualTo(targetPos)) {
                    creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#ff0000' }, reusePath: 50 });
                }
            }
            creep.say('FOLLOW');
          }

          // If in range, attack (this is redundant but keeps behavior consistent if move fails)
          if (creep.attack(closestHostile) === OK) { /* attack should happen here */ }
          if (creep.rangedAttack(closestHostile) === OK) { /* ranged attack if applicable */ }
        } else {
          creep.memory.state = 'GATHERING';
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

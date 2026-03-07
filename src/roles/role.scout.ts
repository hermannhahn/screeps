import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Scout
 * Exploration creep that moves between rooms to map the world.
 * Does NOT perform any physical tasks (harvest, build, etc.)
 */
export default class RoleScout {
  public static run(creep: Creep): void {
    // 0. Global Population Control: If too many scouts, suicide the excess
    const scouts = Object.values(Game.creeps).filter(c => c.memory.role === 'scout');
    const maxScouts = 1; // Match SpawnLogic limit
    if (scouts.length > maxScouts) {
       // Only suicide if this is one of the "newest" scouts or just random
       // To keep it simple, if we are over limit, just suicide if not the first one in the list
       if (scouts[0].id !== creep.id) {
          console.log(`[Scout] ${creep.name}: Overpopulation detected (${scouts.length}/${maxScouts}). Suiciding to clear clutter.`);
          creep.suicide();
          return;
       }
    }

    // 1. If no current target room, find one
    if (!creep.memory.targetRoom) {
      this.assignNewRoom(creep);
    }

    // 2. Move to target room
    if (creep.memory.targetRoom) {
      if (creep.room.name !== creep.memory.targetRoom) {
        const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
        if (exitDir !== ERR_NO_PATH && exitDir !== ERR_INVALID_ARGS) {
          const exit = creep.pos.findClosestByRange(exitDir as ExitConstant);
          if (exit) {
            const result = CreepLogic.moveTo(creep, exit);
            
            // Check if stuck
            if (result === ERR_NO_PATH) {
              console.log(`[Scout] ${creep.name}: Path to ${creep.memory.targetRoom} is blocked. Choosing another room.`);
              this.assignNewRoom(creep);
            }

            // Position tracking to detect if stuck behind walls/creeps
            if (creep.memory.lastX === creep.pos.x && creep.memory.lastY === creep.pos.y) {
              creep.memory.stuckCount = (creep.memory.stuckCount || 0) + 1;
            } else {
              creep.memory.stuckCount = 0;
              creep.memory.lastX = creep.pos.x;
              creep.memory.lastY = creep.pos.y;
            }

            if ((creep.memory.stuckCount || 0) > 5) {
              console.log(`[Scout] ${creep.name}: Stuck for 5 ticks. Choosing another room.`);
              this.assignNewRoom(creep);
              creep.memory.stuckCount = 0;
            }

          }
        } else {
          // If path is blocked, find another room
          console.log(`[Scout] ${creep.name}: No exit to ${creep.memory.targetRoom}. Choosing another room.`);
          this.assignNewRoom(creep);
        }
      } else {
        // We are in the target room! Scan it (Scanner handles this)
        // Then move to a random position to avoid blocking the exit
        if (Game.time % 10 === 0) {
           this.assignNewRoom(creep); // Move to next room after scanning
        } else {
           // Idle in the room
           const midPoint = new RoomPosition(25, 25, creep.room.name);
           CreepLogic.moveTo(creep, midPoint);
        }
      }
    }
  }

  /**
   * Assigns a random neighboring room to the scout.
   */
  private static assignNewRoom(creep: Creep): void {
    const exits = Game.map.describeExits(creep.room.name);
    const directions = Object.keys(exits) as ExitKey[];
    if (directions.length > 0) {
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      creep.memory.targetRoom = exits[randomDir];
      console.log(`[Scout] ${creep.name}: Moving to explore room ${creep.memory.targetRoom}`);
    }
  }
}

// Memory extension for TypeScript
declare global {
  interface CreepMemory {
    targetRoom?: string;
    lastX?: number;
    lastY?: number;
    stuckCount?: number;
  }
}

import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Scout
 * Exploration creep that moves between rooms to map the world.
 * Does NOT perform any physical tasks (harvest, build, etc.)
 */
export default class RoleScout {
  public static run(creep: Creep): void {
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
            CreepLogic.moveTo(creep, exit);
          }
        } else {
          // If path is blocked, find another room
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
  }
}

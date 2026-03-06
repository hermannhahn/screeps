/**
 * Creep General Logic
 * Handles global creep behaviors and state management.
 */
export default class CreepLogic {
  /**
   * General state management for creeps.
   * Switches 'working' boolean based on energy levels.
   */
  public static updateState(creep: Creep): void {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('⚡');
    }
  }

  /**
   * Unified movement with path reuse.
   */
  public static moveTo(creep: Creep, target: RoomPosition | { pos: RoomPosition }): number {
    return creep.moveTo(target, { reusePath: 10, visualizePathStyle: { stroke: '#ffffff' } });
  }
}

// Memory extension for TypeScript
declare global {
  interface CreepMemory {
    role: string;
    working: boolean;
    targetId?: string;
  }
}

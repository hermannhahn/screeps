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
    const energy = creep.store[RESOURCE_ENERGY];
    const capacity = creep.store.getCapacity();

    // Switch to refill (🔄) if empty
    if (creep.memory.working && energy === 0) {
      creep.memory.working = false;
      creep.memory.targetId = undefined; 
      creep.say('🔄');
    }

    // Switch to working (⚡) if almost full (>= 90%) or full
    if (!creep.memory.working && energy >= capacity * 0.9) {
      creep.memory.working = true;
      creep.memory.targetId = undefined;
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

import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskDeliver from "../tasks/task.deliver";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Supplier
 * Logistics logic with strict target persistence.
 * Dynamic behavior during attacks.
 */
export default class RoleSupplier {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    const isUnderAttack = this.isRoomUnderAttack(creep.room);

    if (creep.memory.working) {
      // 1. If no targetId, search for delivery targets
      if (!creep.memory.targetId) {
        // PRIORITY 1: Spawns, Extensions, and Towers
        const primaryTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                          s.structureType === STRUCTURE_EXTENSION || 
                          s.structureType === STRUCTURE_TOWER) && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (primaryTarget) {
          creep.memory.targetId = primaryTarget.id;
        } else {
          // PRIORITY 2: Non-Source Containers
          const logisticsTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                           s.pos.findInRange(FIND_SOURCES, 1).length === 0 && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          });

          if (logisticsTarget) {
            creep.memory.targetId = logisticsTarget.id;
          } else {
            // PRIORITY 3: Storage (Last delivery priority)
            if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
              creep.memory.targetId = creep.room.storage.id;
            } else {
              // FALLBACK: Repair or Upgrade
              const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
              });
              if (repairTarget) {
                creep.memory.targetId = repairTarget.id;
              } else if (creep.room.controller) {
                creep.memory.targetId = creep.room.controller.id;
              }
            }
          }
        }
      }

      // 2. Execute based on targetId
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof StructureController) TaskUpgrade.run(creep);
        else if (target instanceof StructureTower || target instanceof StructureSpawn || 
                 target instanceof StructureExtension || target instanceof StructureContainer ||
                 target instanceof StructureStorage) TaskDeliver.run(creep);
        else TaskRepair.run(creep);
      }
    } else {
      // 1. If no targetId, search for energy collection
      if (!creep.memory.targetId) {
        // Priority 1: Drops
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => {
            if (r.resourceType !== RESOURCE_ENERGY || r.amount < 20) return false;
            const reserved = this.getEnergyReserved(creep.room, r.id);
            return r.amount >= (creep.store.getFreeCapacity() + reserved);
          }
        });

        if (dropped) {
          creep.memory.targetId = dropped.id;
        } else {
          // Priority 2: Source Containers (OR any container/storage if under attack)
          const collectionTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
              if (s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_STORAGE) return false;
              if (!isUnderAttack && s.structureType === STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length === 0) return false;
              
              const energy = (s as StructureContainer | StructureStorage).store[RESOURCE_ENERGY];
              if (energy < 50) return false;

              const reserved = this.getEnergyReserved(creep.room, s.id);
              return energy >= (creep.store.getFreeCapacity() + reserved);
            }
          }) as StructureContainer | StructureStorage;
          
          if (collectionTarget) {
            creep.memory.targetId = collectionTarget.id;
          } else {
            // Priority 3: Manual Harvest (if no harvesters)
            const harvesters = creep.room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' });
            if (harvesters.length === 0) {
              const source = creep.pos.findClosestByRange(FIND_SOURCES);
              if (source) creep.memory.targetId = source.id;
            }
          }
        }
      }

      // 2. Execute based on targetId
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof Source) TaskHarvest.run(creep);
        else TaskCollect.run(creep);
      }
    }
  }

  /**
   * Calculates the total energy capacity of all creeps currently targeting a specific energy source.
   */
  private static getEnergyReserved(room: Room, targetId: Id<any>): number {
    const targetingCreeps = room.find(FIND_MY_CREEPS, {
      filter: (c) => !c.memory.working && c.memory.targetId === targetId
    });

    return targetingCreeps.reduce((sum, c) => sum + c.store.getFreeCapacity(), 0);
  }

  /**
   * Defines if the room is under actual attack.
   * Checks for hostiles with offensive body parts.
   */
  private static isRoomUnderAttack(room: Room): boolean {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) return false;

    // Filter for creeps that can actually do damage or heal
    const actualThreats = hostiles.filter(h => 
      h.getActiveBodyparts(ATTACK) > 0 || 
      h.getActiveBodyparts(RANGED_ATTACK) > 0 || 
      h.getActiveBodyparts(WORK) > 0 ||
      h.getActiveBodyparts(HEAL) > 0
    );

    return actualThreats.length > 0;
  }
}

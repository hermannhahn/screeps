import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskDeliver from "../tasks/task.deliver";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskBuild from "../tasks/task.build";
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

          // PRIORITY 2.5: Controller Container/Link (CRITICAL for growth)
          const controllerTarget = creep.room.controller ? creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK) && 
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 100
          })[0] : null;

          if (controllerTarget) {
            creep.memory.targetId = controllerTarget.id;
          } else if (logisticsTarget) {
            creep.memory.targetId = logisticsTarget.id;
          } else {

            // PRIORITY 3: Storage (Last delivery priority)
            if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
              creep.memory.targetId = creep.room.storage.id;
            } else {
              // FALLBACK: Repair -> Build -> Upgrade
              const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
              });

              if (repairTarget) {
                creep.memory.targetId = repairTarget.id;
              } else {
                const buildTarget = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
                if (buildTarget) {
                  creep.memory.targetId = buildTarget.id;
                } else if (creep.room.controller) {
                  creep.memory.targetId = creep.room.controller.id;
                }
              }
            }
          }
        }
      }

      // 2. Execute based on targetId
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof StructureController) TaskUpgrade.run(creep);
        else if (target instanceof ConstructionSite) TaskBuild.run(creep);
        else if (target instanceof StructureTower || target instanceof StructureSpawn || 
                 target instanceof StructureExtension || target instanceof StructureContainer ||
                 target instanceof StructureStorage) TaskDeliver.run(creep);
        else if (target instanceof Structure) TaskRepair.run(creep);
        else creep.memory.targetId = undefined; // CLEAR if invalid
      }
    } else {
      // 1. If no targetId, search for energy collection
      if (!creep.memory.targetId) {
        // Priority 1: Drops, Tombstones, Ruins
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
        });
        if (dropped) {
          creep.memory.targetId = dropped.id;
        } else {
          const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
            filter: (t) => t.store[RESOURCE_ENERGY] >= 50
          });
          if (tombstone) {
            creep.memory.targetId = tombstone.id;
          } else {
            const ruin = creep.pos.findClosestByRange(FIND_RUINS, {
              filter: (r) => r.store[RESOURCE_ENERGY] >= 50
            });
            if (ruin) {
              creep.memory.targetId = ruin.id;
            } else {
              // Priority 2: Source Containers
              const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => {
                  if (s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_STORAGE) return false;
                  if (!isUnderAttack && s.structureType === STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length === 0) return false;
                  const energy = (s as StructureContainer | StructureStorage).store[RESOURCE_ENERGY];
                  return energy >= 50;
                }
              });
              if (container) {
                creep.memory.targetId = container.id;
              } else {
                // Priority 3: Storage (Withdraw only if high priority targets need energy)
                const needsEnergy = creep.room.find(FIND_MY_STRUCTURES, {
                  filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                                  s.structureType === STRUCTURE_EXTENSION || 
                                  s.structureType === STRUCTURE_TOWER) && 
                                 s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }).length > 0;

                if (needsEnergy && creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >= 100) {
                  creep.memory.targetId = creep.room.storage.id;
                } else {
                  // Priority 4: Manual Harvest (EMERGENCY)
                  const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
                  if (source) creep.memory.targetId = source.id;
                }
              }
            }
          }
        }
      }

      // 2. Execute based on targetId
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof Source) TaskHarvest.run(creep);
        else if (target instanceof Structure || target instanceof Resource || target instanceof Tombstone || target instanceof Ruin) TaskCollect.run(creep);
        else creep.memory.targetId = undefined; // CLEAR if invalid
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

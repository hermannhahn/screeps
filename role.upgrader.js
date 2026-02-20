/**
 * Role: Upgrader (Prioriza receber energia de Suppliers)
 */
const roleUpgrader = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 fetch');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else { // Creep needs energy
        let energyTarget = null;

        // Priority 1: Targeted by a Supplier
        if (creep.memory.assignedSupplier) {
          const supplier = Game.getObjectById(creep.memory.assignedSupplier);
          if (supplier && supplier.store[RESOURCE_ENERGY] > 0) {
            energyTarget = supplier;
          } else {
            // Clear assignment if supplier is gone or empty
            delete creep.memory.assignedSupplier;
          }
        }

        // Priority 2: Dropped Energy (most energy first)
        if (!energyTarget) {
          const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType == RESOURCE_ENERGY && r.amount > 0
          }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
          if (droppedEnergy.length > 0) {
            energyTarget = droppedEnergy[0];
          }
        }

        // Priority 3: Containers near Sources
        if (!energyTarget) {
          const containers = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER) &&
                           s.store[RESOURCE_ENERGY] > 0
          });
          // Filter containers that are within 3 tiles of any source
          const containersNearSources = containers.filter(container => {
            return creep.room.find(FIND_SOURCES).some(source => container.pos.getRangeTo(source) <= 3);
          }).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b)); // Sort by proximity

          if (containersNearSources.length > 0) {
            energyTarget = containersNearSources[0];
          }
        }

        // Priority 4: Storage
        if (!energyTarget) {
          const storage = creep.room.storage;
          if (storage && storage.store[RESOURCE_ENERGY] > 0) {
            energyTarget = storage;
          }
        }
        
        // Execute energy collection
        if (energyTarget) {
          if (creep.withdraw(energyTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE || creep.pickup(energyTarget) == ERR_NOT_IN_RANGE) {
            creep.moveTo(energyTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
          }
        } else {
          // Fallback if no energy source found: upgrade controller to stay busy
          if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
          }
        }
    } // This brace closes the 'run' function
  }
};

module.exports = roleUpgrader;

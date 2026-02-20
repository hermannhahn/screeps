/**
 * Role: Harvester (Minerador com Designação de Fonte)
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.store.getFreeCapacity() > 0) {
      // Tenta usar a fonte designada na memória
      let source = Game.getObjectById(creep.memory.sourceId);
      
      // Fallback: se não tiver fonte na memória, pega a mais próxima
      if (!source) {
        source = creep.pos.findClosestByRange(FIND_SOURCES);
        creep.memory.sourceId = source.id;
      }

      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } else {
      const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == creep.room.name);
      
      if (suppliers.length > 0) {
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (container) {
          if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          }
          return;
        }
      }

      if (suppliers.length > 0) {
        const targetSupplier = creep.pos.findClosestByRange(FIND_CREEPS, {
          filter: (c) => c.memory.role == 'supplier' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (targetSupplier) {
          if (creep.transfer(targetSupplier, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targetSupplier);
          }
          return;
        }
      }

      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                       s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });
      if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0]);
        }
      }
    }
  }
};

module.exports = roleHarvester;

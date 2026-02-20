/**
 * Role: Harvester (Minerador)
 * Responsabilidade: Extrair energia e passar para a logística (Suppliers/Containers).
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.store.getFreeCapacity() > 0) {
      const sources = creep.room.find(FIND_SOURCES);
      if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } else {
      const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == creep.room.name);
      
      // PRIORIDADE 1: Depositar no container mais próximo (se houver supplier vivo)
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

      // PRIORIDADE 2: Entregar para o supplier mais próximo
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

      // PRIORIDADE 3: Abastecer Spawn e Extensions (Fallback se a logística falhar)
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

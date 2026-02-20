/**
 * Role: Harvester (Revisado para evitar congestionamento)
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.store.getFreeCapacity() > 0) {
      const source = Game.getObjectById(creep.memory.sourceId);
      
      if (source) {
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
        }
      } else {
        creep.say('❓ NoSource');
        // Se não tem fonte, tenta pegar a que menos tem gente como último recurso
        const sources = creep.room.find(FIND_SOURCES);
        creep.memory.sourceId = sources[0].id; 
      }
    } else {
      const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == creep.room.name);
      
      if (suppliers.length > 0) {
        // Tenta achar container no raio de 2 blocos (mais restrito para evitar caminhada)
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_CONTAINER && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                         creep.pos.getRangeTo(s) <= 2
        });

        if (container) {
          if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          }
        } else {
          // Dropa para o supplier
          creep.drop(RESOURCE_ENERGY);
        }
      } else {
        // MODO EMERGÊNCIA: Abastece a base se não houver transportadores
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (target) {
          if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
          }
        }
      }
    }
  }
};

module.exports = roleHarvester;

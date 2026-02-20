/**
 * Role: Harvester (Minerador Estático com modo de Emergência)
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    // 1. Fase de Coleta
    if (creep.store.getFreeCapacity() > 0) {
      let source = Game.getObjectById(creep.memory.sourceId);
      if (!source) {
        source = creep.pos.findClosestByRange(FIND_SOURCES);
        creep.memory.sourceId = source.id;
      }

      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } 
    // 2. Fase de Entrega/Descarte
    else {
      const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == creep.room.name);
      
      if (suppliers.length > 0) {
        // --- LOGÍSTICA ATIVA (Mineração Estática) ---
        
        // Tenta encontrar um container próximo (3 blocos)
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_CONTAINER && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                         creep.pos.getRangeTo(s) <= 3
        });

        if (container) {
          if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          }
        } else {
          // Se não houver container, dropa no chão para o supplier pegar
          creep.drop(RESOURCE_ENERGY);
          creep.say('📦 Drop');
        }
      } else {
        // --- MODO DE EMERGÊNCIA (Atua como Supplier) ---
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (target) {
          if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
          }
        }
      }
    }
  }
};

module.exports = roleHarvester;

/**
 * Role: Builder
 * Responsabilidade: Coleta energia (priorizando Suppliers) e constrói estruturas (Construction Sites).
 */
const roleBuilder = {
  /** @param {Creep} creep **/
  run: function(creep) {
    // Alterna estados: coletando ou construindo
    if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.building = false;
      creep.say('🔄 fetch');
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
      creep.memory.building = true;
      creep.say('🚧 build');
    }

    if (creep.memory.building) {
      const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
      let target = null;
      if (targets.length > 0) {
        targets.sort((a, b) => {
          // Prioriza o mais avançado
          const progressA = a.progress / a.progressTotal;
          const progressB = b.progress / b.progressTotal;
          if (progressA !== progressB) {
            return progressB - progressA; // Maior progresso primeiro
          }
          // Se o progresso for igual, prioriza o mais próximo
          return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
        });
        target = targets[0];
      }
      if (target) {
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Se não houver nada para construir, ajuda no upgrade para não ficar ocioso
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    } else {
      // MESMA LÓGICA DO UPGRADER: Prioriza Supplier, fallback para Source
      const supplier = creep.pos.findClosestByRange(FIND_CREEPS, {
        filter: (c) => c.memory.role == 'supplier' && c.store[RESOURCE_ENERGY] > 0
      });

      if (supplier) {
        if (creep.pos.getRangeTo(supplier) > 1) {
          creep.moveTo(supplier, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
  }
};

module.exports = roleBuilder;

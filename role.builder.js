const taskCollectEnergy = require('task.collectEnergy');

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
    } else { // Creep needs energy
      taskCollectEnergy.run(creep);
    }
  }
};

module.exports = roleBuilder;

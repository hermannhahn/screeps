/**
 * Role: Harvester
 * Responsabilidade: Coletar energia das fontes e abastecer estruturas críticas (Spawner, Extensions, Towers).
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    // Alterna o estado de coleta/entrega
    if (creep.memory.transferring && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.transferring = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.transferring && creep.store.getFreeCapacity() == 0) {
      creep.memory.transferring = true;
      creep.say('⚡ transfer');
    }

    if (creep.memory.transferring) {
      // Prioriza Spawner e Extensions, depois Towers
      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION ||
              structure.structureType == STRUCTURE_SPAWN ||
              structure.structureType == STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      });

      if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Se tudo estiver cheio, ajuda no upgrade (opcional)
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    } else {
      // Procura a fonte de energia mais próxima
      const sources = creep.room.find(FIND_SOURCES);
      if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }
};

module.exports = roleHarvester;

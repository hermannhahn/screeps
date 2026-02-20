/**
 * Role: Upgrader
 * Responsabilidade: Coletar energia das fontes e realizar o upgrade do Controller da sala.
 */
const roleUpgrader = {
  /** @param {Creep} creep **/
  run: function(creep) {
    // Alterna o estado de coleta/upgrade
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      // Realiza o upgrade do Controller
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
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

module.exports = roleUpgrader;

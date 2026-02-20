const taskCollectEnergy = require('task.collectEnergy');

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
      taskCollectEnergy.run(creep);
    }
  }
};

module.exports = roleUpgrader; // This brace closes the 'run' function
  }
};

module.exports = roleUpgrader;

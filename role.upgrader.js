const taskCollectEnergy = require('task.collectEnergy');
const taskUpgrade = require('task.upgrade');

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
      taskUpgrade.run(creep);
    } else { // Creep needs energy
      taskCollectEnergy.run(creep);
    }
  }
};

module.exports = roleUpgrader;

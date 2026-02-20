const taskCollectEnergy = require('task.collectEnergy');
const taskBuild = require('task.build');
const taskUpgrade = require('task.upgrade');

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
      if (!taskBuild.run(creep)) { // If no building task was assigned
        // Fallback to upgrading if nothing to build
        taskUpgrade.run(creep);
      }
    } else { // Creep needs energy
      taskCollectEnergy.run(creep);
    }
  }
};

module.exports = roleBuilder;

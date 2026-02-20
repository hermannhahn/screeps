const taskUpgrade = {
  /**
   * @param {Creep} creep
   * @returns {boolean} True if the creep is upgrading or moving to upgrade, false otherwise.
   */
  run: function(creep) {
    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      return true;
    }
    return false; // Already upgrading or done
  }
};

module.exports = taskUpgrade;

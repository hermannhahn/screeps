const taskUpgrade = {
  run: function(creep: Creep): boolean {
    if (creep.room.controller) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return true;
    }
    return false;
  }
};

export default taskUpgrade;

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
    } else {
      // 1. Tenta encontrar o Supplier mais próximo que tenha energia
      const supplier = creep.pos.findClosestByRange(FIND_CREEPS, {
        filter: (c) => c.memory.role == 'supplier' && c.store[RESOURCE_ENERGY] > 0
      });

      if (supplier) {
        // Se houver supplier, move-se até ele para facilitar a transferência
        if (creep.pos.getRangeTo(supplier) > 1) {
          creep.moveTo(supplier, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        // Nota: O Supplier é quem executa o comando .transfer()
      } else {
        // 2. Fallback: vai até a fonte mais próxima se não houver logistica disponível
        const source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
  }
};

module.exports = roleUpgrader;

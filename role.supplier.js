/**
 * Role: Supplier (Logística com entrega para Upgraders e Builders)
 * Prioridades de entrega de energia:
 * 1. Spawns e Extensions (garante a criação de novos creeps)
 * 2. Upgraders e Builders (mantém o controle de sala e construção ativos)
 * 3. Towers (defesa da base)
 */
const roleSupplier = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.store.getUsedCapacity() == 0) {
      const sources = creep.room.find(FIND_SOURCES);
      let targetEnergy = null;

      for (const source of sources) {
        const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
          filter: (r) => r.resourceType == RESOURCE_ENERGY
        });
        if (dropped.length > 0) {
          targetEnergy = dropped[0];
          break;
        }

        const structures = source.pos.findInRange(FIND_STRUCTURES, 3, {
          filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && 
                         s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });
        if (structures.length > 0) {
          targetEnergy = structures[0];
          break;
        }
      }

      if (targetEnergy) {
        if (creep.pickup(targetEnergy) == ERR_NOT_IN_RANGE || creep.withdraw(targetEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targetEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    } else {
      // 1. Prioridade Máxima: Spawn e Extensions
      let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                       s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });

      // 2. Prioridade Secundária: Upgraders e Builders (Se a base estiver abastecida)
      if (!target) {
        target = creep.pos.findClosestByRange(FIND_CREEPS, {
          filter: (c) => (c.memory.role == 'upgrader' || c.memory.role == 'builder') && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
      }

      // 3. Prioridade Terciária: Towers
      if (!target) {
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
      }

      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Se absolutamente tudo estiver cheio, faz o upgrade pessoalmente
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    }
  }
};

module.exports = roleSupplier;

/**
 * Role: Supplier (Logística)
 * Responsabilidade: Coletar energia do chão ou containers perto das fontes e abastecer a base.
 */
const roleSupplier = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if (creep.store.getUsedCapacity() == 0) {
      // 1. Procurar energia no chão ou containers perto das fontes (raio de 3 blocos)
      const sources = creep.room.find(FIND_SOURCES);
      let targetEnergy = null;

      for (const source of sources) {
        // Recursos caídos no chão
        const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
          filter: (r) => r.resourceType == RESOURCE_ENERGY
        });
        if (dropped.length > 0) {
          targetEnergy = dropped[0];
          break;
        }

        // Containers ou Tombstones
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
      // 2. Entrega: Prioridade Spawn -> Extensions -> Towers
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
        // Se tudo cheio, ajuda no upgrade para não ficar parado
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    }
  }
};

module.exports = roleSupplier;

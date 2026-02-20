const taskBuild = require('task.build');
const taskUpgrade = require('task.upgrade');

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
        // Tenta usar o alvo de energia armazenado na memória, se existir e for válido
        let targetEnergy = null;
        if (creep.memory.targetEnergyId) {
          const storedTarget = Game.getObjectById(creep.memory.targetEnergyId);
          if (storedTarget && 
             ((storedTarget.resourceType == RESOURCE_ENERGY && storedTarget.amount > 0) || 
              (storedTarget.store && storedTarget.store.getUsedCapacity(RESOURCE_ENERGY) > 0))) {
            targetEnergy = storedTarget;
          } else {
            // Se o alvo armazenado não é mais válido, limpa a memória
            delete creep.memory.targetEnergyId;
          }
        }

        // Se não houver um alvo válido na memória, procura um novo
        if (!targetEnergy) {
          for (const source of sources) {
            const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
              filter: (r) => r.resourceType == RESOURCE_ENERGY && r.amount > 0
            });
            if (dropped.length > 0) {
              targetEnergy = dropped[0];
              creep.memory.targetEnergyId = targetEnergy.id; // Armazena o ID
              break;
            }

            const structures = source.pos.findInRange(FIND_STRUCTURES, 3, {
              filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && 
                             s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            });
            if (structures.length > 0) {
              targetEnergy = structures[0];
              creep.memory.targetEnergyId = targetEnergy.id; // Armazena o ID
              break;
            }
          }
        }

      if (targetEnergy) {
        let collectResult;
        if (targetEnergy.resourceType == RESOURCE_ENERGY) { // dropped resource
          collectResult = creep.pickup(targetEnergy);
        } else { // structure (container/storage)
          collectResult = creep.withdraw(targetEnergy, RESOURCE_ENERGY);
        }

        if (collectResult == ERR_NOT_IN_RANGE) {
          creep.moveTo(targetEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (collectResult == OK) {
          // Se o creep estiver cheio ou o alvo ficar vazio, limpa o targetEnergyId
          if (creep.store.getFreeCapacity() === 0 || 
             (targetEnergy.resourceType == RESOURCE_ENERGY && targetEnergy.amount === 0) || 
             (targetEnergy.store && targetEnergy.store.getUsedCapacity(RESOURCE_ENERGY) === 0)) {
            delete creep.memory.targetEnergyId;
          }
        } else if (collectResult == ERR_NOT_ENOUGH_RESOURCES) {
          // Se não houver mais recursos, limpa o targetEnergyId
          delete creep.memory.targetEnergyId;
        }
      }
    } else {
      // 1. Tenta continuar a entrega para um alvo já atribuído
      let target = null;
      if (creep.memory.deliveryTargetId) {
        const assignedTarget = Game.getObjectById(creep.memory.deliveryTargetId);
        if (assignedTarget && assignedTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          target = assignedTarget;
        } else {
          // Limpa a atribuição se o alvo não é mais válido
          if (assignedTarget && assignedTarget.memory.assignedSupplier === creep.id) {
            delete assignedTarget.memory.assignedSupplier;
          }
          delete creep.memory.deliveryTargetId;
        }
      }

      // Se não houver alvo atribuído ou o alvo anterior for inválido, procura novos
      if (!target) {
        // Prioridade Máxima: Spawn e Extensions
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        // Prioridade Secundária: Upgraders e Builders (Se a base estiver abastecida e não estiverem atribuídos)
        if (!target) {
          target = creep.pos.findClosestByRange(FIND_CREEPS, {
            filter: (c) => (c.memory.role == 'upgrader' || c.memory.role == 'builder') && 
                           c.store[RESOURCE_ENERGY] === 0 &&
                           !c.memory.assignedSupplier // Não atribua se já tiver um supplier a caminho
          });

          // Se um upgrader/builder for alvo, marca-o
          if (target) {
            target.memory.assignedSupplier = creep.id;
            creep.memory.deliveryTargetId = target.id;
          }
        }

        // Prioridade Terciária: Towers
        if (!target) {
          target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          });
        }
      }
      
      // Lógica de transferência
      if (target) {
        const transferResult = creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult == ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        } else if (transferResult === OK || transferResult === ERR_FULL) {
          // Limpa a atribuição se a transferência for bem-sucedida ou o alvo estiver cheio
          if (creep.memory.deliveryTargetId && Game.getObjectById(creep.memory.deliveryTargetId) && Game.getObjectById(creep.memory.deliveryTargetId).memory.assignedSupplier === creep.id) {
            delete Game.getObjectById(creep.memory.deliveryTargetId).memory.assignedSupplier;
          }
          delete creep.memory.deliveryTargetId;
        }
      } else {
        // Se absolutamente tudo estiver cheio e não houver alvo para transferência
        
        // Prioridade 4: Construir (se houver construction sites)
        if (!taskBuild.run(creep)) { // If no building task was assigned
          // Prioridade 5: Ajudar no upgrade (se não houver construções)
          taskUpgrade.run(creep);
        }
      }
    }
  }
};

module.exports = roleSupplier;

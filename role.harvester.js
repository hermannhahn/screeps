/**
 * Role: Harvester (Revisado para evitar congestionamento)
 */
const roleHarvester = {
  /** @param {Creep} creep **/
  run: function(creep) {
    // Localized hostile detection and flee logic
    const hostileCreepsInRoom = creep.room.find(FIND_HOSTILE_CREEPS);
    const extensions = creep.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
    const hasEnoughExtensions = extensions.length >= 5;

    // Harvesters only flee if directly threatened AND the room is considered "under attack"
    // (i.e., has enough extensions to mount a defense)
    const threateningHostiles = creep.pos.findInRange(hostileCreepsInRoom, 3); // Check within 3 tiles (attack range)
    if (threateningHostiles.length > 0 && hasEnoughExtensions) {
      const closestHostile = creep.pos.findClosestByRange(threateningHostiles); // Find closest *threatening* hostile
      if (closestHostile) {
        // Move away from the hostile
        const fleePath = PathFinder.search(
          creep.pos,
          { pos: closestHostile.pos, range: 5 }, // Try to get at least 5 tiles away from hostile
          {
            flee: true, // This is the key for fleeing!
            plainCost: 1,
            swampCost: 5,
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                if (!room) return new PathFinder.CostMatrix();

                let costMatrix = new PathFinder.CostMatrix();
                
                // Avoid all hostile creeps with high cost
                room.find(FIND_HOSTILE_CREEPS).forEach(c => costMatrix.set(c.pos.x, c.pos.y, 255));

                // Avoid structures and construction sites (except roads and containers, as harvesters might need to interact with containers)
                room.find(FIND_STRUCTURES).forEach(struct => {
                    if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_RAMPART) {
                        costMatrix.set(struct.pos.x, struct.pos.y, 255);
                    }
                });
                room.find(FIND_CONSTRUCTION_SITES).forEach(site => {
                    if (site.structureType !== STRUCTURE_ROAD && site.structureType !== STRUCTURE_CONTAINER && site.structureType !== STRUCTURE_RAMPART) {
                        costMatrix.set(site.pos.x, site.pos.y, 255);
                    }
                });
                return costMatrix;
            },
          }
        );
        if (fleePath.path.length > 0) {
          creep.moveTo(fleePath.path[0], { visualizePathStyle: { stroke: '#00ffff' } });
          return; // Skip other actions this tick
        } 
        // Removed the else block to move to spawn as it caused unwanted behavior
      }
    }

    // Original harvester logic follows...
    if (creep.store.getFreeCapacity() > 0) {
      const source = Game.getObjectById(creep.memory.sourceId);
      
      if (source) {
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 10 });
        }
      } else {
        creep.say('❓ NoSource');
        // Se não tem fonte, tenta pegar a que menos tem gente como último recurso
        const sources = creep.room.find(FIND_SOURCES);
        creep.memory.sourceId = sources[0].id; 
      }
    } else {
      const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == creep.room.name);
      
      if (suppliers.length > 0) {
        // Tenta achar container no raio de 2 blocos (mais restrito para evitar caminhada)
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_CONTAINER && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                         creep.pos.getRangeTo(s) <= 2
        });

        if (container) {
          if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container);
          }
        } else {
          // Dropa para o supplier
          creep.drop(RESOURCE_ENERGY);
        }
      } else {
        // MODO EMERGÊNCIA: Abastece a base se não houver transportadores
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (target) {
          if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
          }
        }
      }
    }
  }
};

module.exports = roleHarvester;

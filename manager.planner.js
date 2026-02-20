const managerPlanner = {
  /** @param {Room} room **/
  run: function(room) {
    // Periodic check to save CPU
    if (Game.time % 100 !== 0) return; // Check every 100 ticks

    // Do not plan if under attack
    const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
    if (hostileCreeps.length > 0) {
      console.log(`Room ${room.name} under attack, suspending planning.`);
      return;
    }

    // Initialize blueprint stage
    if (room.memory.blueprintStage === undefined) {
      room.memory.blueprintStage = 0; // 0: Spawn roads, 1: Source roads
    }

    // Only executes planning if there aren't too many active construction sites (limit 5 to avoid overwhelming)
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length > 5) {
      console.log(`Room ${room.name} has ${constructionSites.length} construction sites, suspending planning.`);
      return;
    }

    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) return;

    const spawn = spawns[0];
    
    // BLUEPRINT 1: Roads around the Spawn (Distance 2 to keep 1 free block)
    if (room.memory.blueprintStage === 0) {
      this.planRoadRing(room, spawn.pos, 2);
      // Check if blueprint 1 is completed (no construction sites left)
      if (constructionSites.length === 0) {
        console.log(`Blueprint 1 completed in room ${room.name}. Advancing to Blueprint 2.`);
        room.memory.blueprintStage = 1;
      }
    }

    // BLUEPRINT 2: Roads from each Source to the nearest existing road around the spawn
    if (room.memory.blueprintStage === 1) {
      this.planSourceRoads(room, spawn.pos);
      // Check if blueprint 2 is completed (no construction sites left)
      if (constructionSites.length === 0) {
        console.log(`Blueprint 2 completed in room ${room.name}. Advancing to Blueprint 3.`);
        room.memory.blueprintStage = 2;
      }
    }

    // BLUEPRINT 3: Roads from Controller to nearest existing road
    if (room.memory.blueprintStage === 2) {
      this.planControllerRoads(room);
      if (constructionSites.length === 0) { // Assuming all current construction sites are for Blueprint 3
        console.log(`Blueprint 3 completed in room ${room.name}. Advancing to Blueprint 4.`);
        room.memory.blueprintStage = 3;
      }
    }

    // BLUEPRINT 4: Roads from Mineral to nearest existing road
    if (room.memory.blueprintStage === 3) {
      this.planMineralRoads(room);
      if (constructionSites.length === 0) { // Assuming all current construction sites are for Blueprint 4
        console.log(`Blueprint 4 completed in room ${room.name}. Advancing to Blueprint 5.`);
        room.memory.blueprintStage = 4; // For future blueprints
      }
    }
  },

  /** 
   * Creates a ring of roads around a position
   * @param {Room} room 
   * @param {RoomPosition} centerPos 
   * @param {number} distance 
   */
  planRoadRing: function(room, centerPos, distance) {
    for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
      for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
        // Apenas o perímetro do quadrado
        if (x === centerPos.x - distance || x === centerPos.x + distance ||
            y === centerPos.y - distance || y === centerPos.y + distance) {
          
          const pos = new RoomPosition(x, y, room.name);
          
          // Verifica se o terreno é passável (não é parede)
          const terrain = room.getTerrain().get(x, y);
          if (terrain === TERRAIN_MASK_WALL) continue;

          // Verifica se já existe construção ou estrutura ali
          const look = pos.look();
          const hasStructure = look.some(obj => obj.type === 'structure' || obj.type === 'constructionSite');
          
          if (!hasStructure) {
            room.createConstructionSite(x, y, STRUCTURE_ROAD);
          }
        }
      }
    }
  },

  /**
   * Plans roads from each source to the nearest road around the spawn.
   * @param {Room} room
   * @param {RoomPosition} spawnPos The position of the primary spawn.
   */
  planSourceRoads: function(room, spawnPos) {
    const sources = room.find(FIND_SOURCES);
    const existingRoadsAroundSpawn = room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_ROAD && s.pos.getRangeTo(spawnPos) <= 3
    });

    if (existingRoadsAroundSpawn.length === 0) {
        console.log("No existing roads around spawn for Blueprint 2 to connect to yet.");
        return;
    }

    for (const source of sources) {
        // Find the nearest existing road around the spawn to connect to
        const nearestRoadSegment = source.pos.findClosestByPath(existingRoadsAroundSpawn);
        
        if (!nearestRoadSegment) {
            console.log(`Could not find a path from source ${source.id} to any road around spawn.`);
            continue;
        }

        // Plan path from source to the nearest road segment
        const path = room.findPath(source.pos, nearestRoadSegment.pos, {
            ignoreCreeps: true,
            swampCost: 1, // Treat swamps like plain for roads
            plainCost: 1,
            // Cost callback to avoid existing structures (except roads themselves) and other construction sites
            costCallback: function(roomName, costMatrix) {
                if (roomName !== room.name) return; // Only interested in current room

                room.find(FIND_STRUCTURES).forEach(function(s) {
                    // Avoid non-road structures
                    if (s.structureType !== STRUCTURE_ROAD) {
                        costMatrix.set(s.pos.x, s.pos.y, 255);
                    }
                });
                room.find(FIND_CONSTRUCTION_SITES).forEach(function(s) {
                    costMatrix.set(s.pos.x, s.pos.y, 255);
                });
            }
        });

        // Create construction sites along the path
        for (const segment of path) {
            const pos = new RoomPosition(segment.x, segment.y, room.name);
            const look = pos.lookFor(LOOK_STRUCTURES);
            const lookCS = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            
            // Only create if there's no existing structure or construction site
            if (look.length === 0 && lookCS.length === 0) {
                // Ensure it's not trying to build a road on itself if already built
                if (!pos.findInRange(existingRoadsAroundSpawn, 0).length) {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                }
            }
        }
    }
  },

  /**
   * Helper function to plan roads from a specific start position to the nearest existing road.
   * @param {Room} room
   * @param {RoomPosition} startPos The starting position for the path.
   * @param {string} blueprintName For logging purposes.
   * @returns {boolean} True if construction sites were created, false otherwise.
   */
  _planRoadsFromToNearestRoad: function(room, startPos, blueprintName) {
    const existingRoads = room.find(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_ROAD
    });

    if (existingRoads.length === 0) {
      console.log(`No existing roads in room ${room.name} for ${blueprintName} to connect to yet.`);
      return false;
    }

    const nearestRoad = startPos.findClosestByPath(existingRoads);

    if (!nearestRoad) {
      console.log(`Could not find a path from ${startPos} for ${blueprintName} to any existing road.`);
      return false;
    }

    const path = room.findPath(startPos, nearestRoad.pos, {
      ignoreCreeps: true,
      swampCost: 1, // Treat swamps like plain for roads
      plainCost: 1,
      costCallback: function(roomName, costMatrix) {
        if (roomName !== room.name) return;

        room.find(FIND_STRUCTURES).forEach(function(s) {
          if (s.structureType !== STRUCTURE_ROAD) { // Avoid non-road structures
            costMatrix.set(s.pos.x, s.pos.y, 255);
          }
        });
        room.find(FIND_CONSTRUCTION_SITES).forEach(function(s) {
          costMatrix.set(s.pos.x, s.pos.y, 255);
        });
      }
    });

    let sitesCreated = 0;
    for (const segment of path) {
      const pos = new RoomPosition(segment.x, segment.y, room.name);
      const look = pos.lookFor(LOOK_STRUCTURES);
      const lookCS = pos.lookFor(LOOK_CONSTRUCTION_SITES);
      
      if (look.length === 0 && lookCS.length === 0) {
        if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD) === OK) {
          sitesCreated++;
        }
      }
    }
    if (sitesCreated > 0) {
      console.log(`${blueprintName}: Created ${sitesCreated} construction sites.`);
      return true;
    }
    return false;
  },

  /**
   * Plans roads from the room controller to the nearest existing road.
   * @param {Room} room
   */
  planControllerRoads: function(room) {
    if (!room.controller) return false;
    return this._planRoadsFromToNearestRoad(room, room.controller.pos, "Blueprint 3 (Controller Roads)");
  },

  /**
   * Plans roads from each mineral to the nearest existing road.
   * @param {Room} room
   */
  planMineralRoads: function(room) {
    const minerals = room.find(FIND_MINERALS);
    let sitesCreatedTotal = 0;
    for (const mineral of minerals) {
      if (this._planRoadsFromToNearestRoad(room, mineral.pos, `Blueprint 4 (Mineral Roads - ${mineral.id})`)) {
        sitesCreatedTotal++;
      }
    }
    return sitesCreatedTotal > 0;
  }
};

module.exports = managerPlanner;

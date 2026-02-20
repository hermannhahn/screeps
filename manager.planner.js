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
      room.memory.blueprintStage = 0; // 0: Spawn Roads, 1: Extensions, 2: Source Roads, 3: Controller Roads, 4: Mineral Roads
    }

    const BLUEPRINT_NAMES = {
        0: "Spawn Roads",
        1: "Extensions",
        2: "Source Roads",
        3: "Controller Roads",
        4: "Mineral Roads"
    };

    const nextBlueprintToPlanStage = room.memory.blueprintStage;
    const nextBlueprintToPlanName = BLUEPRINT_NAMES[nextBlueprintToPlanStage] || `Unknown Blueprint (${nextBlueprintToPlanStage})`;

    // Only executes planning if there aren't too many active construction sites (limit 5 to avoid overwhelming)
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length > 5) {
      console.log(`Room ${room.name} has ${constructionSites.length} construction sites. Current blueprint being planned: ${nextBlueprintToPlanName}. Suspending planning.`);
      return;
    }

    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) return;

    const spawn = spawns[0];
    
    // BLUEPRINT 0: Roads around the Spawn (Distance 2 to keep 1 free block)
    if (room.memory.blueprintStage === 0) {
      const sitesCreatedByBlueprint0 = this.planRoadRing(room, spawn.pos, 2);
      // Check for completion only if no new sites were created in this tick
      if (sitesCreatedByBlueprint0 === 0) {
        // Now, check if there are any *existing* road construction sites in the blueprint area
        const roadConstructionSitesInRing = room.find(FIND_CONSTRUCTION_SITES, {
          filter: (cs) => cs.structureType === STRUCTURE_ROAD && cs.pos.getRangeTo(spawn.pos) <= 2
        }).length;

        // If no new sites were created AND no construction sites are pending for this blueprint, then it's complete.
        if (roadConstructionSitesInRing === 0) {
          console.log(`Blueprint 0 (${BLUEPRINT_NAMES[0]}) completed in room ${room.name}. Advancing to Blueprint 1 (${BLUEPRINT_NAMES[1]}).`);
          room.memory.blueprintStage = 1;
        } else {
            // Still has pending road construction sites from this blueprint. Don't advance yet.
            console.log(`Blueprint 0 (${BLUEPRINT_NAMES[0]}) has ${roadConstructionSitesInRing} road construction sites pending.`);
        }
      } else {
          console.log(`Blueprint 0 (${BLUEPRINT_NAMES[0]}) created ${sitesCreatedByBlueprint0} new road construction sites.`);
      }
    }

    // BLUEPRINT 1: Extensions (5 extensions near spawn, min 3 distance)
    if (room.memory.blueprintStage === 1) {
      const sitesCreatedByBlueprint1 = this.planExtensions(room, spawn.pos, 5, 3);

      if (sitesCreatedByBlueprint1 === 0) { // No new sites were created this tick
        const extensionConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
          filter: (cs) => cs.structureType === STRUCTURE_EXTENSION
        }).length;
        const builtExtensions = room.find(FIND_MY_STRUCTURES, {
          filter: (s) => s.structureType === STRUCTURE_EXTENSION
        }).length;

        const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const targetExtensions = Math.min(5, maxExtensionsForRCL); // Plan up to 5, but not more than RCL allows

        // If no new sites were created AND no extension construction sites are pending,
        // AND the number of built extensions plus pending construction sites equals the target
        if (extensionConstructionSites === 0 && (builtExtensions >= targetExtensions)) {
          console.log(`Blueprint 1 (${BLUEPRINT_NAMES[1]}) completed in room ${room.name}. Advancing to Blueprint 2 (${BLUEPRINT_NAMES[2]}).`);
          room.memory.blueprintStage = 2;
        } else if (extensionConstructionSites > 0) {
            console.log(`Blueprint 1 (${BLUEPRINT_NAMES[1]}) has ${extensionConstructionSites} extension construction sites pending.`);
        } else if (builtExtensions < targetExtensions) {
            console.log(`Blueprint 1 (${BLUEPRINT_NAMES[1]}) has ${builtExtensions}/${targetExtensions} built extensions. No more sites created this tick.`);
        }
      } else {
          console.log(`Blueprint 1 (${BLUEPRINT_NAMES[1]}) created ${sitesCreatedByBlueprint1} new extension construction sites.`);
      }
    }

    // BLUEPRINT 2: Roads from each Source to the nearest existing road around the spawn
    if (room.memory.blueprintStage === 2) {
      const sitesCreatedByBlueprint2 = this.planSourceRoads(room, spawn.pos);

      if (sitesCreatedByBlueprint2 === 0) { // No new sites were created this tick
        // Count road construction sites specifically from sources
        const sourceRoadConstructionSites = room.find(FIND_SOURCES).some(source => {
          return source.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, { // Check in a radius around sources
            filter: (cs) => cs.structureType === STRUCTURE_ROAD
          }).length > 0;
        });

        // If no new sites were created AND no source-related road construction sites are pending
        if (!sourceRoadConstructionSites) {
          console.log(`Blueprint 2 (${BLUEPRINT_NAMES[2]}) completed in room ${room.name}. Advancing to Blueprint 3 (${BLUEPRINT_NAMES[3]}).`);
          room.memory.blueprintStage = 3;
        } else {
            console.log(`Blueprint 2 (${BLUEPRINT_NAMES[2]}) has pending source-related road construction sites.`);
        }
      } else {
          console.log(`Blueprint 2 (${BLUEPRINT_NAMES[2]}) created ${sitesCreatedByBlueprint2} new source road construction sites.`);
      }
    }

    // BLUEPRINT 3: Roads from Controller to nearest existing road
    if (room.memory.blueprintStage === 3) {
      const sitesCreatedByBlueprint3 = this.planControllerRoads(room);

      if (sitesCreatedByBlueprint3 === 0) { // No new sites were created this tick
        // Count road construction sites specifically near the controller
        const controllerRoadConstructionSites = room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, { // Check in a radius around controller
            filter: (cs) => cs.structureType === STRUCTURE_ROAD
        }).length > 0;

        // If no new sites were created AND no controller-related road construction sites are pending
        if (!controllerRoadConstructionSites) {
            console.log(`Blueprint 3 (${BLUEPRINT_NAMES[3]}) completed in room ${room.name}. Advancing to Blueprint 4 (${BLUEPRINT_NAMES[4]}).`);
            room.memory.blueprintStage = 4;
        } else {
            console.log(`Blueprint 3 (${BLUEPRINT_NAMES[3]}) has pending controller-related road construction sites.`);
        }
      } else {
          console.log(`Blueprint 3 (${BLUEPRINT_NAMES[3]}) created ${sitesCreatedByBlueprint3} new controller road construction sites.`);
      }
    }

    // BLUEPRINT 4: Roads from Mineral to nearest existing road
    if (room.memory.blueprintStage === 4) {
      const sitesCreatedByBlueprint4 = this.planMineralRoads(room);

      if (sitesCreatedByBlueprint4 === 0) { // No new sites were created this tick
        // Count road construction sites specifically near minerals
        const mineralRoadConstructionSites = room.find(FIND_MINERALS).some(mineral => {
          return mineral.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, { // Check in a radius around minerals
            filter: (cs) => cs.structureType === STRUCTURE_ROAD
          }).length > 0;
        });

        // If no new sites were created AND no mineral-related road construction sites are pending
        if (!mineralRoadConstructionSites) {
          console.log(`Blueprint 4 (${BLUEPRINT_NAMES[4]}) completed in room ${room.name}. Advancing to Blueprint 5 (Final/Other).`);
          room.memory.blueprintStage = 5; // For future blueprints
        } else {
            console.log(`Blueprint 4 (${BLUEPRINT_NAMES[4]}) has pending mineral-related road construction sites.`);
        }
      } else {
          console.log(`Blueprint 4 (${BLUEPRINT_NAMES[4]}) created ${sitesCreatedByBlueprint4} new mineral road construction sites.`);
            }
          },
      
        /**
         * Creates a ring of roads around a position
         * @param {Room} room   * @param {RoomPosition} centerPos 
   * @param {number} distance 
   */
  planRoadRing: function(room, centerPos, distance) {
    let sitesCreated = 0;
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
            if (room.createConstructionSite(x, y, STRUCTURE_ROAD) === OK) {
              sitesCreated++;
            }
          }
        }
      }
    }
    return sitesCreated;
  },

  /**
   * Plans extensions near the spawn at a minimum distance.
   * @param {Room} room
   * @param {RoomPosition} spawnPos The position of the primary spawn.
   * @param {number} count The number of extensions to plan.
   * @param {number} minDistance Minimum distance from spawn.
   */
  planExtensions: function(room, spawnPos, count, minDistance) {
    let plannedCount = 0;
    let sitesCreated = 0;
    // Iterate through positions around the spawn
    for (let xOffset = -5; xOffset <= 5; xOffset++) { // Search area around spawn
      for (let yOffset = -5; yOffset <= 5; yOffset++) {
        if (plannedCount >= count) break; // Stop if target count reached for *planning*

        const x = spawnPos.x + xOffset;
        const y = spawnPos.y + yOffset;
        const pos = new RoomPosition(x, y, room.name);

        // Check if position is within bounds
        if (x < 0 || x > 49 || y < 0 || y > 49) continue;

        // Check distance from spawn
        if (pos.getRangeTo(spawnPos) < minDistance) continue;

        // Check if terrain is passable (not a wall)
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) continue;

        // Check if already occupied by structure or construction site
        const look = pos.look();
        const hasBlockingStructure = look.some(obj => 
            (obj.type === LOOK_STRUCTURES && obj.structure.structureType !== STRUCTURE_ROAD) || // Allow roads underneath
            obj.type === LOOK_CONSTRUCTION_SITES
        );
        if (hasBlockingStructure) continue;

        // Ensure it's not a position the spawn itself occupies
        if (pos.isEqualTo(spawnPos)) continue;

        // Create construction site
        if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
          plannedCount++;
          sitesCreated++; // Count actual new sites created
        }
      }
      if (plannedCount >= count) break; // Stop if target count reached for *planning*
    }
    return sitesCreated;
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
        return 0;
    }

    let sitesCreatedTotal = 0;
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
                    if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD) === OK) {
                      sitesCreatedTotal++;
                    }
                }
            }
        }
    }
    return sitesCreatedTotal;
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
      return 0; // Changed to return 0
    }

    const nearestRoad = startPos.findClosestByPath(existingRoads);

    if (!nearestRoad) {
      console.log(`Could not find a path from ${startPos} for ${blueprintName} to any existing road.`);
      return 0; // Changed to return 0
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
    // Changed to return sitesCreated
    return sitesCreated;
  },

  /**
   * Plans roads from the room controller to the nearest existing road.
   * @param {Room} room
   */
  planControllerRoads: function(room) {
    if (!room.controller) return 0;
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
      sitesCreatedTotal += this._planRoadsFromToNearestRoad(room, mineral.pos, `Blueprint 4 (Mineral Roads - ${mineral.id})`);
    }
    return sitesCreatedTotal;
  }
};

module.exports = managerPlanner;

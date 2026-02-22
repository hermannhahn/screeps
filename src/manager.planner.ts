const managerPlanner = {
    run: function(room: Room) {
        if (Game.time % 100 !== 0) return;

        const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const hasEnoughExtensions = extensions.length >= 5;

        if (hostileCreeps.length > 0 && hasEnoughExtensions) {
            console.log(`Room ${room.name} under attack with enough extensions, suspending planning.`);
            return;
        }

        if (room.memory.maxBlueprintStageCompleted === undefined) {
            room.memory.maxBlueprintStageCompleted = -1; // -1 indicates no blueprint has been completed yet
        }
        if (room.memory.currentBlueprintStage === undefined) {
            room.memory.currentBlueprintStage = 0; // Start checking from blueprint 0
        }

        const BLUEPRINT_NAMES: { [key: number]: string } = {
            0: "Spawn Roads",
            1: "Extensions",
            2: "Source Roads",
            3: "Controller Roads",
            4: "Mineral Roads"
        };
        const MAX_BLUEPRINT_STAGES = Object.keys(BLUEPRINT_NAMES).length;

        let currentBlueprintStage = room.memory.currentBlueprintStage;
        const nextBlueprintToPlanName = BLUEPRINT_NAMES[currentBlueprintStage] || `Unknown Blueprint (${currentBlueprintStage})`;

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 5) {
            console.log(`Room ${room.name} has ${constructionSites.length} construction sites. Current blueprint: ${nextBlueprintToPlanName}. Suspending.`);
            return;
        }

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        // Loop currentBlueprintStage for continuous review if all blueprints are completed
        if (room.memory.maxBlueprintStageCompleted === MAX_BLUEPRINT_STAGES - 1 && room.memory.currentBlueprintStage >= MAX_BLUEPRINT_STAGES) {
            room.memory.currentBlueprintStage = 0;
        }

        let sitesCreatedThisTick = 0;
        let currentStage = room.memory.currentBlueprintStage;

        // Ensure currentStage does not exceed MAX_BLUEPRINT_STAGES when planning a new one
        if (currentStage < MAX_BLUEPRINT_STAGES) {
            switch (currentStage) {
                case 0: // Spawn Roads
                    sitesCreatedThisTick = this.planRoadRing(room, spawn.pos, 1);
                    break;
                case 1: // Extensions
                    if (room.controller && room.controller.level >= 2) {
                        sitesCreatedThisTick = this.planExtensions(room, spawn.pos, 5, 2);
                    }
                    break;
                case 2: // Source Roads
                    sitesCreatedThisTick = this.planSourceRoads(room);
                    break;
                case 3: // Controller Roads
                    if (room.controller) {
                        sitesCreatedThisTick = this.planControllerRoads(room);
                    }
                    break;
                // Add cases for other blueprint stages here
            }
        }


        // If no sites were created in the current stage, check for completion
        // If it's complete, advance the currentBlueprintStage
        if (sitesCreatedThisTick === 0) {
            // Check if the current stage is actually complete (all structures built, no CS)
            if (this._checkBlueprintCompletion(room, currentStage)) {
                // If we completed a *new* blueprint stage (i.e., it was not just a review of an existing one)
                if (currentStage === room.memory.maxBlueprintStageCompleted + 1) {
                    room.memory.maxBlueprintStageCompleted = currentStage;
                }
                room.memory.currentBlueprintStage++;
            }
        }
    },

    planRoadRing: function(room: Room, centerPos: RoomPosition, distance: number): number {
        let sitesCreated = 0;
        for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
            for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
                if (x === centerPos.x - distance || x === centerPos.x + distance ||
                    y === centerPos.y - distance || y === centerPos.y + distance) {
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;
                    if (room.createConstructionSite(x, y, STRUCTURE_ROAD) === OK) {
                        sitesCreated++;
                    }
                }
            }
        }
        return sitesCreated;
    },

    planExtensions: function(room: Room, spawnPos: RoomPosition, count: number, minDistance: number): number {
        let plannedCount = 0;
        let sitesCreated = 0;

        const roads = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }).concat(room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        } as any) as any);

        if (roads.length === 0) return 0;

        for (const road of roads) {
            if (plannedCount >= count) break;

            // Look for positions at exactly range 2 from the road
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (plannedCount >= count) break;
                    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue; // Skip range 0 and 1

                    const x = road.pos.x + dx;
                    const y = road.pos.y + dy;
                    if (x < 1 || x > 48 || y < 1 || y > 48) continue;

                    const pos = new RoomPosition(x, y, room.name);
                    if (pos.getRangeTo(spawnPos) < minDistance) continue;

                    if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

                    // Check range 1 around this position for ANY structure or construction site
                    const structuresInRange1 = pos.findInRange(FIND_STRUCTURES, 1).length;
                    const sitesInRange1 = pos.findInRange(FIND_CONSTRUCTION_SITES, 1).length;

                    if (structuresInRange1 === 0 && sitesInRange1 === 0) {
                        if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
                            plannedCount++;
                            sitesCreated++;
                        }
                    }
                }
            }
        }
        return sitesCreated;
    },

    planSourceRoads: function(room: Room): number {
        const sources = room.find(FIND_SOURCES);
        let total = 0;
        for (const source of sources) {
            total += this._planRoadsFromToNearestRoad(room, source.pos);
        }
        return total;
    },

    planControllerRoads: function(room: Room): number {
        if (!room.controller) return 0;
        return this._planRoadsFromToNearestRoad(room, room.controller.pos);
    },

    _planRoadsFromToNearestRoad: function(room: Room, startPos: RoomPosition): number {
        const existingRoads = room.find(FIND_STRUCTURES, {
            filter: (s: AnyStructure) => s.structureType === STRUCTURE_ROAD
        }).concat(room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        } as any) as any);

        if (existingRoads.length === 0) return 0;
        const nearestRoad = startPos.findClosestByPath(existingRoads);
        if (!nearestRoad) return 0;

        const path = room.findPath(startPos, nearestRoad.pos, {
            ignoreCreeps: true, swampCost: 1, plainCost: 1
        });

        let sitesCreated = 0;
        for (const segment of path) {
            if (room.createConstructionSite(segment.x, segment.y, STRUCTURE_ROAD) === OK) {
                sitesCreated++;
            }
        }
        return sitesCreated;
    },

    _checkBlueprintCompletion: function(room: Room, stage: number): boolean {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return false;
        const spawn = spawns[0];

        switch (stage) {
            case 0: // Spawn Roads
                const roadConstructionSitesInRing = room.find(FIND_CONSTRUCTION_SITES, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD && cs.pos.getRangeTo(spawn.pos) <= 1
                }).length;
                const builtRoads = room.find(FIND_STRUCTURES, {
                    filter: (s: AnyStructure) => s.structureType === STRUCTURE_ROAD && s.pos.getRangeTo(spawn.pos) <= 1
                }).length;
                return roadConstructionSitesInRing === 0 && builtRoads >= 8; // Assuming 8 roads for a complete ring
            case 1: // Extensions
                if (!room.controller || room.controller.level < 2) return true; // Not applicable or too early
                const extensionConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_EXTENSION
                }).length;
                const builtExtensions = room.find(FIND_MY_STRUCTURES, {
                    filter: (s: AnyStructure) => s.structureType === STRUCTURE_EXTENSION
                }).length;
                const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
                const targetExtensions = Math.min(5, maxExtensionsForRCL); // Current planner plans up to 5 extensions
                return extensionConstructionSites === 0 && builtExtensions >= targetExtensions;
            case 2: // Source Roads
                const sourceRoadCS = room.find(FIND_SOURCES).some(source => {
                    return source.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
                        filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
                    }).length > 0;
                });
                if (sourceRoadCS) return false;
                // Check if all sources have a road connection to the main path (this is complex, for simplicity we'll assume no CS means complete)
                return true; // Placeholder, needs more robust check
            case 3: // Controller Roads
                if (!room.controller) return true; // No controller
                const controllerRoadCS = room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
                }).length > 0;
                if (controllerRoadCS) return false;
                // Check if controller has a road connection
                return true; // Placeholder, needs more robust check
            // case 4: // Mineral Roads - Add similar logic
            default:
                return true; // Assume unknown blueprints are "complete"
        }
    }
};

export default managerPlanner;

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

        if (room.memory.blueprintStage === undefined) {
            room.memory.blueprintStage = 0;
        }

        const BLUEPRINT_NAMES: { [key: number]: string } = {
            0: "Spawn Roads",
            1: "Extensions",
            2: "Source Roads",
            3: "Controller Roads",
            4: "Mineral Roads"
        };

        const nextBlueprintToPlanStage = room.memory.blueprintStage;
        const nextBlueprintToPlanName = BLUEPRINT_NAMES[nextBlueprintToPlanStage] || `Unknown Blueprint (${nextBlueprintToPlanStage})`;

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 5) {
            console.log(`Room ${room.name} has ${constructionSites.length} construction sites. Current blueprint: ${nextBlueprintToPlanName}. Suspending.`);
            return;
        }

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        if (room.memory.blueprintStage === 0) {
            const sitesCreated = this.planRoadRing(room, spawn.pos, 1);
            if (sitesCreated === 0) {
                const roadConstructionSitesInRing = room.find(FIND_CONSTRUCTION_SITES, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD && cs.pos.getRangeTo(spawn.pos) <= 1
                }).length;
                if (roadConstructionSitesInRing === 0) {
                    room.memory.blueprintStage = 1;
                }
            }
        }

        if (room.memory.blueprintStage === 1 && room.controller && room.controller.level >= 2) {
            const sitesCreated = this.planExtensions(room, spawn.pos, 5, 2);
            if (sitesCreated === 0) {
                const extensionConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_EXTENSION
                }).length;
                const builtExtensions = room.find(FIND_MY_STRUCTURES, {
                    filter: (s: AnyStructure) => s.structureType === STRUCTURE_EXTENSION
                }).length;
                const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
                const targetExtensions = Math.min(5, maxExtensionsForRCL);

                if (extensionConstructionSites === 0 && (builtExtensions >= targetExtensions)) {
                    room.memory.blueprintStage = 2;
                }
            }
        }

        if (room.memory.blueprintStage === 2) {
            const sitesCreated = this.planSourceRoads(room);
            if (sitesCreated === 0) {
                const sourceRoadCS = room.find(FIND_SOURCES).some(source => {
                    return source.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
                        filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
                    }).length > 0;
                });
                if (!sourceRoadCS) room.memory.blueprintStage = 3;
            }
        }

        if (room.memory.blueprintStage === 3 && room.controller) {
            const sitesCreated = this.planControllerRoads(room);
            if (sitesCreated === 0) {
                const controllerRoadCS = room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
                    filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
                }).length > 0;
                if (!controllerRoadCS) room.memory.blueprintStage = 4;
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
        for (let xOffset = -5; xOffset <= 5; xOffset++) {
            for (let yOffset = -5; yOffset <= 5; yOffset++) {
                if (plannedCount >= count) break;
                const x = spawnPos.x + xOffset;
                const y = spawnPos.y + yOffset;
                if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                const pos = new RoomPosition(x, y, room.name);
                if (pos.getRangeTo(spawnPos) < minDistance) continue;
                if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;
                if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
                    plannedCount++;
                    sitesCreated++;
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
    }
};

export default managerPlanner;

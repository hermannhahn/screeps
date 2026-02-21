const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleSupplier = require('role.supplier');
const roleBuilder = require('role.builder');
const roleDefender = require('role.defender');
const managerPlanner = require('manager.planner');
const taskCollectEnergy = require('task.collectEnergy');
const taskBuild = require('task.build');

// Define OBSTACLE_OBJECT_TYPES if not already defined globally
if (typeof OBSTACLE_OBJECT_TYPES === 'undefined') {
    global.OBSTACLE_OBJECT_TYPES = [
        STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_WALL,
        STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_CONTROLLER,
        STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_OBSERVER,
        STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_LAB, STRUCTURE_TERMINAL,
        STRUCTURE_NUKER, STRUCTURE_FACTORY, STRUCTURE_POWER_BANK
    ];
}

// RoomPosition prototype extensions for common checks
RoomPosition.prototype.isWalkable = function(creepLooking) {
    const terrain = this.lookFor(LOOK_TERRAIN)[0];
    if (terrain === 'wall') return false;

    const structures = this.lookFor(LOOK_STRUCTURES);
    if (_.some(structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType) && (s.structureType !== STRUCTURE_RAMPART || !s.my))) {
        return false;
    }

    const constructionSites = this.lookFor(LOOK_CONSTRUCTION_SITES);
    if (_.some(constructionSites, (cs) => OBSTACLE_OBJECT_TYPES.includes(cs.structureType) && (cs.structureType !== STRUCTURE_RAMPART || !cs.my))) {
        return false;
    }
    
    // Check for creeps blocking the path (unless it's the creep itself)
    const creeps = this.lookFor(LOOK_CREEPS);
    if (creeps.length > 0 && (!creepLooking || creeps[0].id !== creepLooking.id)) { 
        return false;
    }

    return true;
};

RoomPosition.prototype.getAdjacentPositions = function() {
    const positions = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = this.x + dx;
            const y = this.y + dy;
            if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
                positions.push(new RoomPosition(x, y, this.roomName));
            }
        }
    }
    return positions;
};

RoomPosition.prototype.hasCreep = function() {
    return this.lookFor(LOOK_CREEPS).length > 0;
};

function getBestBody(energyLimit) {
    const parts = [];
    let currentCost = 0;
    const bodySet = [WORK, CARRY, MOVE];
    const setCost = 200;
    while (currentCost + setCost <= energyLimit && parts.length < 48) {
        parts.push(...bodySet);
        currentCost += setCost;
    }
    if (parts.length === 0 && energyLimit >= 200) return [WORK, CARRY, MOVE];
    return parts;
}

function getDefenderBody(energyLimit) {
    const parts = [];
    let currentCost = 0;

    // Start with some TOUGH parts for survivability
    const toughCost = BODYPART_COST[TOUGH];
    while (currentCost + toughCost <= energyLimit && parts.length < 48 && parts.filter(p => p === TOUGH).length < 2) {
        parts.push(TOUGH);
        currentCost += toughCost;
    }

    // Add RANGED_ATTACK and MOVE in pairs, ensuring MOVE >= RANGED_ATTACK
    const rangedAttackCost = BODYPART_COST[RANGED_ATTACK]; // Changed to RANGED_ATTACK
    const moveCost = BODYPART_COST[MOVE];
    const pairCost = rangedAttackCost + moveCost;

    while (currentCost + pairCost <= energyLimit && parts.length < 48) {
        parts.push(RANGED_ATTACK, MOVE); // Changed to RANGED_ATTACK
        currentCost += pairCost;
    }

    // Add remaining MOVE parts if possible to maintain speed
    while (currentCost + moveCost <= energyLimit && parts.length < 48 && parts.filter(p => p === MOVE).length < parts.filter(p => p === RANGED_ATTACK).length + parts.filter(p => p === TOUGH).length) { // Changed to RANGED_ATTACK
        parts.push(MOVE);
        currentCost += moveCost;
    }
    
    // Ensure at least one RANGED_ATTACK and one MOVE if possible
    if (parts.filter(p => p === RANGED_ATTACK).length === 0 && currentCost + pairCost <= energyLimit) { // Changed to RANGED_ATTACK
        parts.push(RANGED_ATTACK, MOVE); // Changed to RANGED_ATTACK
        currentCost += pairCost;
    } else if (parts.filter(p => p === MOVE).length === 0 && currentCost + moveCost <= energyLimit) {
        parts.push(MOVE);
        currentCost += moveCost;
    }
    
    if (parts.length === 0 && energyLimit >= (BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE])) { // Changed to RANGED_ATTACK
        return [RANGED_ATTACK, MOVE]; // Minimum combat creep (Changed to RANGED_ATTACK)
    } else if (parts.length === 0 && energyLimit >= BODYPART_COST[MOVE]) {
        return [MOVE]; // Failsafe
    }
    
    return parts;
}

// Helper to calculate spawn time based on body parts
function getSpawnTime(bodyParts) {
    return bodyParts.length * CREEP_SPAWN_TIME; // CREEP_SPAWN_TIME is 3 ticks per body part
}

// Helper to get estimated travel time. Caches pathfinding results.
function getTravelTime(spawn, targetPos, room) {
    const key = `${spawn.id}_${targetPos.x}_${targetPos.y}`;
    if (!room.memory.travelTimes) room.memory.travelTimes = {};
    if (room.memory.travelTimes[key]) {
        return room.memory.travelTimes[key];
    }

    // Use PathFinder to find path length
    const path = PathFinder.search(
        spawn.pos,
        { pos: targetPos, range: 1 }, // Range 1 because creeps work adjacent to target
        {
            plainCost: 2,
            swampCost: 10,
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                if (!room) return new PathFinder.CostMatrix();

                let costMatrix = new PathFinder.CostMatrix();

                room.find(FIND_STRUCTURES).forEach(function(struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        costMatrix.set(struct.pos.x, struct.pos.y, 1);
                    } else if (OBSTACLE_OBJECT_TYPES.includes(struct.structureType) && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        // Avoid all obstacles, except friendly ramparts
                        costMatrix.set(struct.pos.x, struct.pos.y, 255);
                    }
                });

                // Avoid construction sites that block movement
                room.find(FIND_CONSTRUCTION_SITES).forEach(function(site) {
                    if (OBSTACLE_OBJECT_TYPES.includes(site.structureType)) {
                        costMatrix.set(site.pos.x, site.pos.y, 255);
                    }
                });
                return costMatrix;
            },
        }
    ).path;

    const travelTime = path.length;
    room.memory.travelTimes[key] = travelTime; // Cache it
    return travelTime;
}

module.exports.loop = function () {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        
        // --- PLANEJAMENTO DE CONSTRUÇÃO ---
        managerPlanner.run(room);

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) continue;

        const sources = room.find(FIND_SOURCES);
        const rcl = room.controller.level;
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        
        const harvesters = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'harvester' && c.room.name == roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'supplier' && c.room.name == roomName);
        const upgraders = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'upgrader' && c.room.name == roomName);
        const builders = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'builder' && c.room.name == roomName);
        const defenders = _.filter(Game.creeps, (c) => c.memory && c.memory.role == 'defender' && c.room.name == roomName);

        const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const hasEnoughExtensions = extensions.length >= 5;

        // isUnderAttack is true only if hostiles are present AND we have enough extensions to defend
        const isUnderAttack = hostileCreeps.length > 0 && hasEnoughExtensions;
        const targetDefenders = isUnderAttack ? 3 : 0;

        if (!spawn.spawning) {
            let spawned = false;

            // Harvester spawning - Highest priority
            for (let s of sources) {
                const harvestersAtSource = _.filter(harvesters, (h) => h.memory.sourceId == s.id);
                // Find oldest harvester at this source
                const oldestHarvester = _.min(harvestersAtSource, 'ticksToLive');

                let spawnNewHarvester = false;
                let targetHarvesters;
                if (sources.length >= 3) {
                    targetHarvesters = 1; // 1 harvester per source if 3 or more sources
                } else {
                    targetHarvesters = 2; // 2 harvesters per source otherwise
                }

                if (harvestersAtSource.length < targetHarvesters) { // Spawn if below target count
                    spawnNewHarvester = true;
                } else if (harvestersAtSource.length === targetHarvesters && oldestHarvester && oldestHarvester.ticksToLive !== undefined) {
                    // Only consider pre-spawning if we already have the target number of harvesters
                    const body = getBestBody(energyCapacity); // Assume max body for calculating spawn time for replacement
                    const timeToSpawn = getSpawnTime(body);
                    const travelTime = getTravelTime(spawn, s.pos, room);
                    if (oldestHarvester.ticksToLive <= timeToSpawn + travelTime + 5) { // Add a buffer of 5 ticks
                        spawnNewHarvester = true;
                    }
                }

                if (spawnNewHarvester) {
                    const body = (harvesters.length === 0 || oldestHarvester === Infinity) ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
                    spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester', sourceId: s.id } });
                    spawned = true;
                    break;
                }
            }

            // Defender spawning - Second highest priority when under attack
            if (!spawned && isUnderAttack && defenders.length < targetDefenders) {
                const body = getDefenderBody(energyCapacity);
                if (body.length > 0) {
                    spawn.spawnCreep(body, 'Defender' + Game.time, { memory: { role: 'defender' } });
                    spawned = true;
                } else {
                    console.log(`Not enough energy to spawn a defender. Energy: ${energyCapacity}`);
                }
            }
            
            // Supplier spawning
            if (!spawned && !isUnderAttack) { // Only spawn suppliers if not under attack
                const oldestSupplier = _.min(suppliers, 'ticksToLive');
                let spawnNewSupplier = false;
                let targetSuppliers;
                if (sources.length >= 3) {
                    targetSuppliers = sources.length * 1; // 1 supplier per source if 3 or more sources
                } else {
                    targetSuppliers = sources.length * 2; // 2 suppliers per source otherwise
                }
                if (suppliers.length < targetSuppliers || (harvesters.length > 0 && suppliers.length === 0)) { // Initial/target count
                    spawnNewSupplier = true;
                } else if (oldestSupplier && oldestSupplier.ticksToLive !== undefined) {
                    const body = getBestBody(energyCapacity);
                    const timeToSpawn = getSpawnTime(body);
                    if (oldestSupplier.ticksToLive <= timeToSpawn + 5) { // Add a buffer
                        spawnNewSupplier = true;
                    }
                }

                if (spawnNewSupplier) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Supplier' + Game.time, { memory: { role: 'supplier' } });
                    spawned = true;
                }
                else if (!spawned && !isUnderAttack) {
                    // ... Upgrader spawning
                    const oldestUpgrader = _.min(upgraders, 'ticksToLive');
                    let spawnNewUpgrader = false;
                    const targetUpgraders = Math.max(1, 4 - rcl); // Target count

                    if (upgraders.length < targetUpgraders || upgraders.length === 0) { // Initial/target count
                        spawnNewUpgrader = true;
                    } else if (oldestUpgrader && oldestUpgrader.ticksToLive !== undefined) {
                        const body = getBestBody(energyCapacity);
                        const timeToSpawn = getSpawnTime(body);
                        const travelTime = getTravelTime(spawn, room.controller.pos, room);
                        if (oldestUpgrader.ticksToLive <= timeToSpawn + travelTime + 5) { // Add a buffer
                            spawnNewUpgrader = true;
                        }
                    }

                    if (spawnNewUpgrader) {
                        spawn.spawnCreep(getBestBody(energyCapacity), 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
                        spawned = true;
                    }
                }
                else if (!spawned && !isUnderAttack) {
                    // ... Builder spawning
                    const oldestBuilder = _.min(builders, 'ticksToLive');
                    let spawnNewBuilder = false;
                    const targetBuilders = room.find(FIND_CONSTRUCTION_SITES).length > 0 ? 1 : 0; // Target count

                    if (builders.length < targetBuilders) { // Initial/target count
                        spawnNewBuilder = true;
                    } else if (oldestBuilder && oldestBuilder.ticksToLive !== undefined) {
                        const body = getBestBody(energyCapacity);
                        const timeToSpawn = getSpawnTime(body);
                        if (oldestBuilder.ticksToLive <= timeToSpawn + 5) { // Add a buffer
                            spawnNewBuilder = true;
                        }
                    }

                    if (spawnNewBuilder) {
                        spawn.spawnCreep(getBestBody(energyCapacity), 'Builder' + Game.time, { memory: { role: 'builder' } });
                        spawned = true;
                    }
                }
            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0]; // Assuming one spawn per room for simplicity here

        // Stuck at edge detection and reset
        if ((creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) && spawn) {
            console.log(`Creep ${creep.name} stuck at edge (${creep.pos.x},${creep.pos.y}), resetting and moving to spawn.`);
            // Clear current memory/tasks to force a fresh start
            delete creep.memory.deliveryTargetId;
            if (creep.memory.assignedSupplier && Game.getObjectById(creep.memory.assignedSupplier)) {
                delete Game.getObjectById(creep.memory.assignedSupplier).memory.deliveryTargetId;
            }
            delete creep.memory.assignedSupplier;
            delete creep.memory.sourceId; // Harvesters might need this reset

            // Force move to spawn
            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ff0000' } });
            continue; // Skip normal role logic for this tick
        }
        
        if (creep.memory.role == 'harvester') roleHarvester.run(creep);
        if (creep.memory.role == 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role == 'supplier') roleSupplier.run(creep);
        if (creep.memory.role == 'builder') roleBuilder.run(creep);
        if (creep.memory.role == 'defender') roleDefender.run(creep);
    }
}

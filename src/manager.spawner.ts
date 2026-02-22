import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';
import roleDefender from './role.defender';

// OBSTACLE_OBJECT_TYPES and RoomPosition prototypes are global/general utility, keep them in main.ts or separate utility.
// For now, assume they are accessible or will be passed/imported.

function getHarvesterBody(energyLimit: number, rcl: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Determine max WORK parts based on RCL
    const maxWorkParts = (rcl >= 4) ? 7 : 6; // User specified 7 WORK for RCL >= 4, otherwise 6 for lower RCLs

    // Phase 0: Ensure minimum energy for a basic functional creep
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return []; // Not enough energy for a basic creep
    }

    // Phase 1: Add one WORK, one CARRY, and one MOVE as a base
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Phase 2: If RCL >= 4, aim for specific limits (7 WORK, 1 CARRY, 2 MOVE)
    if (rcl >= 4) {
        // Add additional WORK parts up to 7
        while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
            parts.push(WORK);
            currentCost += BODYPART_COST[WORK];
        }
        // Add additional MOVE part up to 2
        while (currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.filter(p => p === MOVE).length < 2 && parts.length < 48) {
            parts.push(MOVE);
            currentCost += BODYPART_COST[MOVE];
        }
        // CARRY is limited to 1 for RCL >= 4, already added in Phase 1
    } else {
        // For RCL < 4, add more WORK parts up to maxWorkParts (6)
        while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
            parts.push(WORK);
            currentCost += BODYPART_COST[WORK];
        }

        // Add remaining CARRY and MOVE parts in a balanced way (1 CARRY, 1 MOVE pair)
        const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
        while (currentCost + pairCost <= energyLimit && parts.length < 48) {
            parts.push(CARRY, MOVE);
            currentCost += pairCost;
        }
    }

    return parts;
}

function getBuilderBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional creep (WORK, CARRY, MOVE)
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return []; // Not enough energy for a basic creep
    }

    // Phase 1: Add one WORK, one CARRY, and one MOVE as a base
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Phase 2: Add more CARRY and MOVE parts in a 1:1 ratio, up to a reasonable limit (e.g., 10 CARRY, 10 MOVE total)
    const maxCarryMovePairs = 10;
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];

    while (currentCost + pairCost <= energyLimit && 
           parts.filter(p => p === CARRY).length < maxCarryMovePairs && 
           parts.filter(p => p === MOVE).length < maxCarryMovePairs && 
           parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }

    // Phase 3: Add more WORK parts up to the maximum limit (e.g., 8 WORK total)
    const maxWorkParts = 8;
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    return parts;
}

function getUpgraderBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional creep (WORK, CARRY, MOVE)
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return []; // Not enough energy for a basic creep
    }

    // Phase 1: Add one WORK, one CARRY, and one MOVE as a base
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Phase 2: Prioritize adding more WORK parts up to the maximum limit (e.g., 10 WORK total)
    const maxWorkParts = 10; // Can be higher for upgraders if controller is far
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    // Phase 3: Add more CARRY and MOVE parts in a 1:1 ratio, up to a reasonable limit (e.g., 5 pairs)
    const maxCarryMovePairs = 5; // To allow carrying sufficient energy and decent speed
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    while (currentCost + pairCost <= energyLimit && 
           parts.filter(p => p === CARRY).length < maxCarryMovePairs && 
           parts.filter(p => p === MOVE).length < maxCarryMovePairs && 
           parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }

    return parts;
}

function getSupplierBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional creep (WORK, CARRY, MOVE)
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return []; // Not enough energy for a basic creep
    }

    // Phase 1: Add one WORK, one CARRY, and one MOVE as a base
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Phase 2: Add more CARRY and MOVE parts in a 1:1 ratio, up to a reasonable limit (e.g., 10 CARRY, 10 MOVE total)
    const maxCarryMovePairs = 10; // To prevent too much CARRY and maintain speed
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];

    while (currentCost + pairCost <= energyLimit && 
           parts.filter(p => p === CARRY).length < maxCarryMovePairs && 
           parts.filter(p => p === MOVE).length < maxCarryMovePairs && 
           parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
    }

    return parts;
}

function getTankBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional tank (TOUGH, MOVE, ATTACK)
    const basicCreepCost = BODYPART_COST[TOUGH] + BODYPART_COST[MOVE] + BODYPART_COST[ATTACK];
    if (energyLimit < basicCreepCost) {
        return [];
    }

    // Phase 1: Add a base (TOUGH, MOVE, ATTACK)
    parts.push(TOUGH, MOVE, ATTACK);
    currentCost += basicCreepCost;

    // Phase 2: Add more TOUGH and MOVE parts in a 1:1 ratio
    const maxPairs = 10; // Limit for number of pairs, e.g., 10 TOUGH, 10 MOVE
    const pairCost = BODYPART_COST[TOUGH] + BODYPART_COST[MOVE];
    while (currentCost + pairCost <= energyLimit &&
           parts.filter(p => p === TOUGH).length < maxPairs &&
           parts.filter(p => p === MOVE).length < maxPairs &&
           parts.length < 48) {
        parts.push(TOUGH, MOVE);
        currentCost += pairCost;
    }

    // Phase 3: Add more ATTACK parts if energy allows (up to a limit)
    const maxAttackParts = 5; // Example limit for ATTACK parts
    while (currentCost + BODYPART_COST[ATTACK] <= energyLimit &&
           parts.filter(p => p === ATTACK).length < maxAttackParts &&
           parts.length < 48) {
        parts.push(ATTACK);
        currentCost += BODYPART_COST[ATTACK];
    }
    
    // Phase 4: Final check to ensure enough MOVE parts to maintain full speed (1 MOVE for every non-MOVE part)
    let nonMoveParts = parts.filter(p => p !== MOVE).length;
    let currentMoveParts = parts.filter(p => p === MOVE).length;
    while (currentMoveParts < nonMoveParts && currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
        currentMoveParts++;
    }

    return parts;
}

function getRangedBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Phase 0: Ensure minimum energy for a basic functional ranged defender (RANGED_ATTACK, MOVE)
    const basicCreepCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return [];
    }

    // Phase 1: Add RANGED_ATTACK and MOVE in a 1:1 ratio
    const pairCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE];
    const maxPairs = 15; // Limit for number of pairs, e.g., 15 RANGED_ATTACK, 15 MOVE
    while (currentCost + pairCost <= energyLimit && 
           parts.filter(p => p === RANGED_ATTACK).length < maxPairs &&
           parts.filter(p => p === MOVE).length < maxPairs &&
           parts.length < 48) {
        parts.push(RANGED_ATTACK, MOVE);
        currentCost += pairCost;
    }

    return parts;
}

// Helper function to check if a source is safe from hostile structures
function isSourceSafe(source: Source, hostileStructures: Structure[], hostileCreeps: Creep[]): boolean {
    const range = 10; // User specified range

    // Check for hostile structures
    for (const hostileStructure of hostileStructures) {
        if (source.pos.getRangeTo(hostileStructure) <= range) {
            return false; // Hostile structure too close
        }
    }

    // Check for hostile creeps
    for (const hostileCreep of hostileCreeps) {
        if (source.pos.getRangeTo(hostileCreep) <= range) {
            return false; // Hostile creep too close
        }
    }

    return true; // No hostile structures or creeps nearby
}


const managerSpawner = {
    run: function(room: Room, spawn: StructureSpawn) {
        if (spawn.spawning) return;

        const allSources = room.find(FIND_SOURCES);
        const hostileStructures = room.find(FIND_HOSTILE_STRUCTURES); // All hostile structures in the room
        const hostileCreepsInRoom = room.find(FIND_HOSTILE_CREEPS); // All hostile creeps in the room
        const sources = allSources.filter(source => isSourceSafe(source, hostileStructures, hostileCreepsInRoom));
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === room.name);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === room.name);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === room.name);
        const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === room.name);
        const defendersRanged = _.filter(Game.creeps, (c) => c.memory.role === 'defender' && c.memory.defenderType === 'ranged' && c.room.name === room.name);
        const defendersTank = _.filter(Game.creeps, (c) => c.memory.role === 'defender' && c.memory.defenderType === 'tank' && c.room.name === room.name);
        const defenders = defendersRanged.length + defendersTank.length; // Total defenders
        const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
        const isUnderAttack = hostileCreeps.length > 0 && extensions.length >= 5;
        const rcl = room.controller?.level || 1;

        // --- Spawning Logic ---
        
        // Priority 1: Harvesters (Most critical for energy production)
        const targetHarvestersPerSource = rcl < 4 ? 2 : 1;
        const totalTargetHarvesters = targetHarvestersPerSource * sources.length;
        if (harvesters.length < totalTargetHarvesters) {
            for (let s of sources) {
                const harvestersAtSource = _.filter(harvesters, (h) => h.memory.sourceId === s.id);
                if (harvestersAtSource.length < targetHarvestersPerSource) {
                    const body = harvesters.length === 0 ? getHarvesterBody(energyAvailable, rcl) : getHarvesterBody(energyCapacity, rcl);
                    if (body.length > 0 && spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester', sourceId: s.id } }) === OK) {
                        return; // Spawned a harvester, stop for this tick
                    }
                }
            }
        }
        
        // Priority 2: Defenders (If under attack)
        if (isUnderAttack && (defendersRanged.length + defendersTank.length) < 3) {
            if (defendersRanged.length < 1) { // Need a Ranged defender
                const body = (defendersRanged.length + defendersTank.length) === 0 ? getRangedBody(energyAvailable) : getRangedBody(energyCapacity);
                if (body.length > 0 && spawn.spawnCreep(body, 'Ranged' + Game.time, { memory: { role: 'defender', defenderType: 'ranged' } }) === OK) {
                    return; // Spawned a Ranged defender, stop for this tick
                }
            } else if (defendersTank.length < 2) { // Need a Tank defender
                const body = (defendersRanged.length + defendersTank.length) === 0 ? getTankBody(energyAvailable) : getTankBody(energyCapacity);
                 if (body.length > 0 && spawn.spawnCreep(body, 'Tank' + Game.time, { memory: { role: 'defender', defenderType: 'tank' } }) === OK) {
                    return; // Spawned a Tank defender, stop for this tick
                }
            }
        }

        // Priority 3: Suppliers (Critical for energy distribution)
        if (suppliers.length < sources.length) {
            const body = suppliers.length === 0 ? getSupplierBody(energyAvailable) : getSupplierBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Supplier' + Game.time, { memory: { role: 'supplier' } }) === OK) {
                return; // Spawned a supplier, stop for this tick
            }
        }
        
        // Priority 4: Upgraders
        const targetUpgraders = rcl === 1 ? 3 : (rcl === 2 ? 2 : 1);
        if (upgraders.length < targetUpgraders) {
            const body = upgraders.length === 0 ? getUpgraderBody(energyAvailable) : getUpgraderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Upgrader' + Game.time, { memory: { role: 'upgrader' } }) === OK) {
                return; // Spawned an upgrader, stop for this tick
            }
        }

        // Priority 5: Builders
        if (builders.length < 1) { // Builders target is 1
            const body = builders.length === 0 ? getBuilderBody(energyAvailable) : getBuilderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Builder' + Game.time, { memory: { role: 'builder' } }) === OK) {
                return; // Spawned a builder, stop for this tick
            }
        }
    }
};

export default managerSpawner;

import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';

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

    // Phase 2: Add more WORK parts up to the maximum limit (e.g., 8 WORK total)
    const maxWorkParts = 8;
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }

    // Phase 3: Add CARRY and MOVE parts to support the WORK parts (e.g., 1 CARRY, 1 MOVE per WORK, or based on energy carried)
    // A common ratio is 1 CARRY and 1 MOVE for every 2 WORK parts, plus some extra CARRY for carrying.
    // Let's aim for a balance where CARRY/MOVE parts are added in pairs,
    // ensuring enough CARRY to carry energy for the WORK parts, and enough MOVE for speed.
    const idealCarryPerWork = 1; // 1 CARRY can hold 50 energy, 1 WORK uses 1 energy/tick for build/repair
    const idealMovePerWork = 0.5; // 1 MOVE for every 2 non-MOVE parts (approx 0.5 MOVE per WORK/CARRY)

    // Calculate current WORK parts count
    const currentWorkParts = parts.filter(p => p === WORK).length;

    // Add CARRY parts to support WORK
    const targetCarryParts = currentWorkParts * idealCarryPerWork;
    while (currentCost + BODYPART_COST[CARRY] <= energyLimit && parts.filter(p => p === CARRY).length < targetCarryParts && parts.length < 48) {
        parts.push(CARRY);
        currentCost += BODYPART_COST[CARRY];
    }

    // Add MOVE parts to maintain speed
    const nonMoveParts = parts.filter(p => p !== MOVE).length;
    const targetMoveParts = Math.ceil(nonMoveParts * idealMovePerWork); // 1 MOVE for every 2 non-MOVE parts
    while (currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.filter(p => p === MOVE).length < targetMoveParts && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }

    // After prioritizing WORK, and then supporting CARRY/MOVE, if there's still energy,
    // add more balanced CARRY/MOVE pairs, but with lower priority.
    const maxAdditionalCarryMovePairs = 5;
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    let addedPairs = 0;
    while (currentCost + pairCost <= energyLimit && addedPairs < maxAdditionalCarryMovePairs && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
        addedPairs++;
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

function getGuardBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Base: 1 TOUGH, 1 ATTACK, 2 MOVE (para garantir mobilidade inicial e ataque)
    const basicCreepCost = BODYPART_COST[TOUGH] + BODYPART_COST[ATTACK] + (BODYPART_COST[MOVE] * 2);
    if (energyLimit < basicCreepCost) {
        return [];
    }
    parts.push(TOUGH, ATTACK, MOVE, MOVE);
    currentCost += basicCreepCost;

    // Adicionar mais TOUGH e MOVE (2 TOUGH para 1 MOVE) para aumentar a resistência e manter a mobilidade
    const toughMovePairCost = (BODYPART_COST[TOUGH] * 2) + BODYPART_COST[MOVE];
    const maxToughMovePairs = 8; // Limite para evitar creeps gigantescos
    let toughMovePairs = 0;
    while (currentCost + toughMovePairCost <= energyLimit && toughMovePairs < maxToughMovePairs && parts.length < 48) {
        parts.push(TOUGH, TOUGH, MOVE);
        currentCost += toughMovePairCost;
        toughMovePairs++;
    }

    // Se ainda houver energia, adicionar mais ATTACK
    const maxAttackParts = 10;
    while (currentCost + BODYPART_COST[ATTACK] <= energyLimit && parts.filter(p => p === ATTACK).length < maxAttackParts && parts.length < 48) {
        parts.push(ATTACK);
        currentCost += BODYPART_COST[ATTACK];
    }
    
    return parts;
}

function getArcherBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Base: 1 RANGED_ATTACK, 1 MOVE
    const basicCreepCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return [];
    }
    parts.push(RANGED_ATTACK, MOVE);
    currentCost += basicCreepCost;

    // Adicionar RANGED_ATTACK e MOVE em pares 1:1
    const rangedMovePairCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE];
    const maxRangedMovePairs = 15; // Limite para evitar creeps gigantescos
    let rangedMovePairs = 0;
    while (currentCost + rangedMovePairCost <= energyLimit && rangedMovePairs < maxRangedMovePairs && parts.length < 48) {
        parts.push(RANGED_ATTACK, MOVE);
        currentCost += rangedMovePairCost;
        rangedMovePairs++;
    }

    return parts;
}


function getScoutBody(energyLimit: number): BodyPartConstant[] {
    if (energyLimit < 50) {
        return [];
    }
    return [MOVE];
}


function getRepairerBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Base: 1 WORK, 1 CARRY, 1 MOVE
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return [];
    }
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Adicionar WORK, CARRY, MOVE em pares balanceados
    const balancedPartCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    while (currentCost + balancedPartCost <= energyLimit && parts.length < 48) {
        parts.push(WORK, CARRY, MOVE);
        currentCost += balancedPartCost;
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
        // Novos contadores para as roles de defesa
        const guards = _.filter(Game.creeps, (c) => c.memory.role === 'guard' && c.room.name === room.name);
        const archers = _.filter(Game.creeps, (c) => c.memory.role === 'archer' && c.room.name === room.name);
        const repairers = _.filter(Game.creeps, (c) => c.memory.role === 'repairer' && c.room.name === room.name); // Novo contador
        
        const damagedStructures = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax
        });
        const isUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;
        const rcl = room.controller?.level || 1;

        // --- Spawning Logic ---
        
        // Priority 1: Harvesters (Most critical for energy production)
        const targetHarvestersPerSource = rcl < 3 ? 2 : 1; // 2 harvesters for RCL 1 & 2, 1 for RCL 3+
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
        
        // Priority 2: Defense (If under attack)
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });
        const hasEnoughExtensionsForCombat = extensions.length >= 15;
        const targetGuards = (isUnderAttack && hasEnoughExtensionsForCombat) ? 1 : 0; // 1 Guard se estiver sob ataque e tiver 15+ extensões
        const targetArchers = (isUnderAttack && hasEnoughExtensionsForCombat) ? 2 : 0; // 2 Archers se estiver sob ataque e tiver 15+ extensões

        if (guards.length < targetGuards) {
            const body = getGuardBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Guard' + Game.time, { memory: { role: 'guard' } }) === OK) {
                return;
            }
        }

        if (archers.length < targetArchers) {
            const body = getArcherBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Archer' + Game.time, { memory: { role: 'archer' } }) === OK) {
                return;
            }
        }
        
        // Priority 3: Suppliers (Critical for energy distribution)
        const targetSuppliers = 2 * sources.length;
        if (suppliers.length < targetSuppliers) {
            const body = suppliers.length === 0 ? getSupplierBody(energyAvailable) : getSupplierBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Supplier' + Game.time, { memory: { role: 'supplier' } }) === OK) {
                return; // Spawned a supplier, stop for this tick
            }
        }
        
        // Priority 4: Scouts (for exploration)
        const scouts = _.filter(Game.creeps, (c) => c.memory.role === 'scout');
        const scoutFlags = _.filter(Game.flags, (f) => f.name.toLowerCase().startsWith('scout'));

        if (scoutFlags.length > 0) {
            for (const flag of scoutFlags) {
                const assignedScout = _.find(scouts, (s) => s.memory.scoutTarget === flag.name);
                if (!assignedScout) {
                    const body = getScoutBody(energyAvailable);
                    if (body.length > 0 && spawn.spawnCreep(body, 'Scout' + Game.time, {
                        memory: {
                            role: 'scout',
                            targetRoom: flag.pos.roomName,
                            scoutTarget: flag.name
                        }
                    }) === OK) {
                        console.log(`Spawning new scout for target ${flag.name} in room ${flag.pos.roomName}`);
                        return;
                    }
                }
            }
        }
        
        // Priority 5: Upgraders
        let targetUpgraders = 1;
        if (rcl >= 4) { // Em RCL 4+
            if (room.storage && room.storage.store[RESOURCE_ENERGY] > 50000) { // Se tiver um storage com bastante energia
                targetUpgraders = 2;
            }
            if (room.storage && room.storage.store[RESOURCE_ENERGY] > 100000) { // Com ainda mais energia
                targetUpgraders = 3;
            }
        }
        if (upgraders.length < targetUpgraders) {
            const body = upgraders.length === 0 ? getUpgraderBody(energyAvailable) : getUpgraderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Upgrader' + Game.time, { memory: { role: 'upgrader' } }) === OK) {
                return; // Spawned an upgrader, stop for this tick
            }
        }

        // Priority 5: Repairers (Manter as estruturas em ordem) - Antes dos builders
        const targetRepairers = (damagedStructures.length > 5 && rcl >= 3) ? 1 : 0; // 1 repairer se houver mais de 5 estruturas danificadas e RCL >= 3
        if (repairers.length < targetRepairers) {
            const body = repairers.length === 0 ? getRepairerBody(energyAvailable) : getRepairerBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Repairer' + Game.time, { memory: { role: 'repairer', repairing: false } }) === OK) {
                return;
            }
        }

        // Priority 6: Builders (Novas construções)
        if (builders.length < 1) { // Builders target is 1
            const body = builders.length === 0 ? getBuilderBody(energyAvailable) : getBuilderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Builder' + Game.time, { memory: { role: 'builder' } }) === OK) {
                return; // Spawned a builder, stop for this tick
            }
        }
    }
};

export default managerSpawner;

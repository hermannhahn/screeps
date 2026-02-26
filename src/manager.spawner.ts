import _ from 'lodash';
import roleHarvester from './role.harvester';
import roleUpgrader from './role.upgrader';
import roleSupplier from './role.supplier';
import roleBuilder from './role.builder';
import managerRemote from './manager.remote';
import { cacheUtils } from './utils.cache';

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

function getRemoteHarvesterBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Base: 1 WORK, 1 CARRY, 1 MOVE
    const basicCreepCost = BODYPART_COST[WORK] + BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return [];
    }
    parts.push(WORK, CARRY, MOVE);
    currentCost += basicCreepCost;

    // Adicionar mais WORK, CARRY, MOVE em pares balanceados, priorizando MOVE para viagens longas
    // Uma proporção boa para remote harvesters é 1 WORK, 1 CARRY, 2 MOVE para equilíbrio entre colheita, transporte e velocidade.
    // Ou simplesmente adicionar o máximo de CARRY e MOVE que pudermos após o WORK.

    const maxWorkParts = 3; // Não precisamos de muitos WORK para um remote harvester
    while (currentCost + BODYPART_COST[WORK] <= energyLimit && parts.filter(p => p === WORK).length < maxWorkParts && parts.length < 48) {
        parts.push(WORK);
        currentCost += BODYPART_COST[WORK];
    }
    
    // Adicionar CARRY e MOVE em pares, priorizando MOVE
    const partPairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    const maxPairs = 10;
    let currentPairs = 0;

    while (currentCost + partPairCost <= energyLimit && currentPairs < maxPairs && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += partPairCost;
        currentPairs++;
    }

    return parts;
}


function getCarrierBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // Carrier needs to prioritize CARRY and MOVE parts.
    // A good ratio is 2 CARRY for every 1 MOVE, but ensure sufficient MOVE for speed.
    // Start with 1 CARRY, 1 MOVE as base.
    const basicCreepCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return [];
    }
    parts.push(CARRY, MOVE);
    currentCost += basicCreepCost;

    // Add CARRY and MOVE in pairs, aiming for 2 CARRY per 1 MOVE, or similar efficiency.
    // Let's add CARRY and MOVE in 1:1 ratio until we hit limits.
    const pairCost = BODYPART_COST[CARRY] + BODYPART_COST[MOVE];
    const maxPairs = 10; // To prevent excessively large creeps, adjust as needed
    let currentPairs = 0;

    while (currentCost + pairCost <= energyLimit && currentPairs < maxPairs && parts.length < 48) {
        parts.push(CARRY, MOVE);
        currentCost += pairCost;
        currentPairs++;
    }

    return parts;
}


function getReserverBody(energyLimit: number): BodyPartConstant[] {
    const parts: BodyPartConstant[] = [];
    let currentCost = 0;

    // A reserver precisa de CLAIM e MOVE. CLAIM é caro (600 energy).
    // O mínimo para um reserver funcional é 1 CLAIM e 1 MOVE.
    const basicCreepCost = BODYPART_COST[CLAIM] + BODYPART_COST[MOVE];
    if (energyLimit < basicCreepCost) {
        return []; // Não há energia suficiente para um creep básico
    }
    parts.push(CLAIM, MOVE);
    currentCost += basicCreepCost;

    // Adicionar mais MOVE parts para aumentar a velocidade, pois CLAIM parts pesam bastante.
    // Uma boa proporção é 1 CLAIM para 2-3 MOVE.
    const maxMoveParts = 3; // Limite razoável de MOVE parts
    while (currentCost + BODYPART_COST[MOVE] <= energyLimit && parts.filter(p => p === MOVE).length < maxMoveParts && parts.length < 48) {
        parts.push(MOVE);
        currentCost += BODYPART_COST[MOVE];
    }
    
    // Se ainda houver energia, pode-se adicionar mais CLAIM para reservar mais rápido,
    // mas 1 CLAIM já é suficiente para manter a reserva de 1 tick.
    const maxClaimParts = 2; // Raramente necessário mais de 2 CLAIM parts
    while (currentCost + BODYPART_COST[CLAIM] <= energyLimit && parts.filter(p => p === CLAIM).length < maxClaimParts && parts.length < 48) {
        parts.push(CLAIM);
        currentCost += BODYPART_COST[CLAIM];
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

        const allSources = cacheUtils.findInRoom(room, FIND_SOURCES) as Source[];
        const hostileStructures = cacheUtils.findInRoom(room, FIND_HOSTILE_STRUCTURES) as Structure[]; // All hostile structures in the room
        const hostileCreepsInRoom = cacheUtils.findInRoom(room, FIND_HOSTILE_CREEPS) as Creep[]; // All hostile creeps in the room
        const sources = allSources.filter(source => isSourceSafe(source, hostileStructures, hostileCreepsInRoom));
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role === 'harvester' && c.room.name === room.name);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role === 'supplier' && c.room.name === room.name);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role === 'upgrader' && c.room.name === room.name);
        const builders = _.filter(Game.creeps, (c) => c.memory.role === 'builder' && c.room.name === room.name);
        const guards = _.filter(Game.creeps, (c) => c.memory.role === 'guard' && c.room.name === room.name);
        const archers = _.filter(Game.creeps, (c) => c.memory.role === 'archer' && c.room.name === room.name);
        const repairers = _.filter(Game.creeps, (c) => c.memory.role === 'repairer' && c.room.name === room.name);
        
        const damagedStructures = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.hits < s.hitsMax) as Structure[];
        const isUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;
        const rcl = room.controller?.level || 1;

        // ... (roomsToExplore logic) ...

        // Priority 1: Harvesters (Most critical for energy production)
        // ... (Harvester spawn logic uses sources) ...
        
        // Priority 2: Defense (If under attack)
        const extensions = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_EXTENSION) as StructureExtension[];
        const hasEnoughExtensionsForCombat = extensions.length >= 15;
        const targetGuards = (isUnderAttack && hasEnoughExtensionsForCombat) ? 1 : 0;
        const targetArchers = (isUnderAttack && hasEnoughExtensionsForCombat) ? 2 : 0;

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
                return;
            }
        }
        
        // Priority 4: Remote Harvesters
        const remoteHarvesters = _.filter(Game.creeps, (c) => c.memory.role === 'remoteHarvester');
        
        // 4.1: Automated Remote Harvesting from ManagerRemote
        const remoteHarvestTargets = managerRemote.getRemoteHarvestTargets(room);
        for (const target of remoteHarvestTargets) {
            const assignedRemoteHarvester = _.find(remoteHarvesters, (rh) => rh.memory.targetRoom === target.roomName && rh.memory.remoteSourceId === target.sourceId);
            if (!assignedRemoteHarvester) {
                const body = getRemoteHarvesterBody(energyCapacity);
                if (body.length > 0 && spawn.spawnCreep(body, 'RemoteHarvester' + Game.time, { 
                    memory: { role: 'remoteHarvester', homeRoom: room.name, targetRoom: target.roomName, remoteSourceId: target.sourceId } 
                }) === OK) {
                    return;
                }
            }
        }

        // 4.2: Legacy/Manual Remote Harvesting from Flags
        const remoteHarvestFlags = _.filter(Game.flags, (f) => f.name.toLowerCase().startsWith('remoteharvest'));
        if (remoteHarvestFlags.length > 0) {
            for (const flag of remoteHarvestFlags) {
                const parts = flag.name.split('_');
                if (parts.length === 3) {
                    const targetRoomName = parts[1];
                    const sourceIdFromFlag = parts[2];
                    const assignedRemoteHarvester = _.find(remoteHarvesters, (rh) => rh.memory.targetRoom === targetRoomName && rh.memory.remoteSourceId === sourceIdFromFlag);
                    if (!assignedRemoteHarvester) {
                        const body = getRemoteHarvesterBody(energyCapacity);
                        if (body.length > 0 && spawn.spawnCreep(body, 'RemoteHarvester' + Game.time, { memory: { role: 'remoteHarvester', homeRoom: room.name, targetRoom: targetRoomName, remoteSourceId: sourceIdFromFlag as Id<Source> } }) === OK) {
                            return;
                        }
                    }
                }
            }
        }
        
        // Priority 5: Carriers
        const carriers = _.filter(Game.creeps, (c) => c.memory.role === 'carrier');
        const carrierFlags = _.filter(Game.flags, (f) => f.name.toLowerCase().startsWith('carrier'));
        if (carrierFlags.length > 0) {
            for (const flag of carrierFlags) {
                const parts = flag.name.split('_');
                if (parts.length === 3) {
                    const targetRoomName = parts[1];
                    const containerIdFromFlag = parts[2];
                    const assignedCarrier = _.find(carriers, (c) => c.memory.targetRoom === targetRoomName && c.memory.remoteContainerId === containerIdFromFlag);
                    if (!assignedCarrier) {
                        const body = getCarrierBody(energyCapacity);
                        if (body.length > 0 && spawn.spawnCreep(body, 'Carrier' + Game.time, { memory: { role: 'carrier', homeRoom: room.name, targetRoom: targetRoomName, remoteContainerId: containerIdFromFlag as Id<StructureContainer> } }) === OK) {
                            return;
                        }
                    }
                }
            }
        }
        
        // Priority 6: Reservers
        const reservers = _.filter(Game.creeps, (c) => c.memory.role === 'reserver');

        // 6.1: Automated Reserving based on scout data
        for (const roomName in Memory.remoteRooms) {
            const data = Memory.remoteRooms[roomName];
            if (data.safe && !data.hasEnemyStructures && data.needsReserving) {
                const assignedReserver = _.find(reservers, (r) => r.memory.targetRoom === roomName);
                if (!assignedReserver) {
                    const body = getReserverBody(energyCapacity);
                    if (body.length > 0 && spawn.spawnCreep(body, 'Reserver' + Game.time, { memory: { role: 'reserver', targetRoom: roomName } }) === OK) {
                        return;
                    }
                }
            }
        }

        // 6.2: Legacy Reservers from Flags
        const reserverFlags = _.filter(Game.flags, (f) => f.name.toLowerCase().startsWith('reserver'));
        if (reserverFlags.length > 0) {
            for (const flag of reserverFlags) {
                const parts = flag.name.split('_');
                if (parts.length === 2) {
                    const targetRoomName = parts[1];
                    const assignedReserver = _.find(reservers, (r) => r.memory.targetRoom === targetRoomName);
                    if (!assignedReserver) {
                        const body = getReserverBody(energyCapacity);
                        if (body.length > 0 && spawn.spawnCreep(body, 'Reserver' + Game.time, { memory: { role: 'reserver', targetRoom: targetRoomName } }) === OK) {
                            return;
                        }
                    }
                }
            }
        }
        
        // Priority 7: Upgraders
        let targetUpgraders = 1;
        if (rcl >= 4) {
            if (room.storage && room.storage.store[RESOURCE_ENERGY] > 50000) targetUpgraders = 2;
            if (room.storage && room.storage.store[RESOURCE_ENERGY] > 100000) targetUpgraders = 3;
        }
        if (upgraders.length < targetUpgraders) {
            const body = upgraders.length === 0 ? getUpgraderBody(energyAvailable) : getUpgraderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Upgrader' + Game.time, { memory: { role: 'upgrader' } }) === OK) {
                return;
            }
        }

        // Priority 8: Repairers
        const targetRepairers = (damagedStructures.length > 5 && rcl >= 3) ? 1 : 0;
        if (repairers.length < targetRepairers) {
            const body = repairers.length === 0 ? getRepairerBody(energyAvailable) : getRepairerBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Repairer' + Game.time, { memory: { role: 'repairer', repairing: false } }) === OK) {
                return;
            }
        }

        // Priority 9: Builders
        if (builders.length < 1) {
            const body = builders.length === 0 ? getBuilderBody(energyAvailable) : getBuilderBody(energyCapacity);
            if (body.length > 0 && spawn.spawnCreep(body, 'Builder' + Game.time, { memory: { role: 'builder' } }) === OK) {
                return;
            }
        }

        // Priority 10: Scouts (Lowest priority and strictly limited)
        if (rcl >= 4) {
            const allScouts = _.filter(Game.creeps, (c) => c.memory.role === 'scout');
            if (allScouts.length < 1) {
                let targetRoomForScout: string | null = null;
                for (const roomName in Memory.roomsToExplore) {
                    if (Memory.roomsToExplore[roomName]) {
                        targetRoomForScout = roomName;
                        break;
                    }
                }
                if (targetRoomForScout) {
                    const body = getScoutBody(energyAvailable);
                    if (body.length > 0 && spawn.spawnCreep(body, 'Scout' + Game.time, { memory: { role: 'scout', targetRoom: targetRoomForScout } }) === OK) {
                        Memory.roomsToExplore[targetRoomForScout] = false;
                        console.log(`Spawning new scout for target room ${targetRoomForScout}`);
                        return;
                    }
                }
            }
        }
    }
};

export default managerSpawner;

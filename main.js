const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleSupplier = require('role.supplier');

function getBestBody(energyLimit) {
    const parts = [];
    let currentCost = 0;
    // Priorizamos WORK e MOVE para mineradores, CARRY é menos vital se houver supplier
    const bodySet = [WORK, CARRY, MOVE];
    const setCost = 200;
    while (currentCost + setCost <= energyLimit && parts.length < 48) {
        parts.push(...bodySet);
        currentCost += setCost;
    }
    if (parts.length === 0 && energyLimit >= 200) return [WORK, CARRY, MOVE];
    return parts;
}

module.exports.loop = function () {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) continue;

        const sources = room.find(FIND_SOURCES);
        const rcl = room.controller.level;
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role == 'harvester' && c.room.name == roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == roomName);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role == 'upgrader' && c.room.name == roomName);

        if (!spawn.spawning) {
            // --- NOVA LÓGICA: VERIFICAÇÃO POR FONTE ---
            let spawned = false;
            
            for (let s of sources) {
                const harvestersAtSource = _.filter(harvesters, (h) => h.memory.sourceId == s.id);
                // Calculamos o poder de mineração total naquela fonte
                const workParts = _.sum(harvestersAtSource, (h) => h.getActiveBodyparts(WORK));
                
                // Uma fonte regenera 10 de energia por tick (3000 a cada 300 ticks).
                // Cada WORK part extrai 2 por tick. Precisamos de 5 WORK parts para saturar.
                // Se a fonte tem 0 harvesters OU menos de 5 WORK parts (e menos de 2 creeps), spawnamos.
                if (harvestersAtSource.length === 0 || (workParts < 5 && harvestersAtSource.length < 2)) {
                    const body = harvesters.length === 0 ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
                    spawn.spawnCreep(body, 'Harvester' + Game.time, { 
                        memory: { role: 'harvester', sourceId: s.id } 
                    });
                    spawned = true;
                    break;
                }
            }

            if (!spawned) {
                // Prioridade 2: Suppliers (Garantir 1 por fonte ou pelo menos 1 se houver harvesters)
                if (suppliers.length < sources.length || (harvesters.length > 0 && suppliers.length === 0)) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Supplier' + Game.time, { memory: { role: 'supplier' } });
                }
                // Prioridade 3: Upgraders
                else if (upgraders.length < Math.max(1, 5 - rcl)) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
                }
            }
        }
    }

    // Execução
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') roleHarvester.run(creep);
        if (creep.memory.role == 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role == 'supplier') roleSupplier.run(creep);
    }
}

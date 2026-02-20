const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleSupplier = require('role.supplier');

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
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role == 'upgrader' && c.room.name == roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == roomName);

        // --- LÓGICA DE POPULAÇÃO AJUSTADA ---
        
        // Mantém harvesters eficientes
        let targetHarvesters = sources.length * (rcl < 3 ? 2 : 1);
        
        // Aumentando a logística: 1 por fonte no início, 2 por fonte em RCL 3+
        let targetSuppliers = sources.length * (rcl < 3 ? 1 : 2);
        
        let targetUpgraders = (rcl === 1 ? 4 : 2);
        if (energyAvailable == energyCapacity) targetUpgraders += 1;

        if (!spawn.spawning) {
            // Prioridade 1: Harvesters (Vital)
            if (harvesters.length < targetHarvesters) {
                let bestSource = sources[0];
                let minCount = 99;
                for (let s of sources) {
                    let count = _.filter(harvesters, (h) => h.memory.sourceId == s.id).length;
                    if (count < minCount) { minCount = count; bestSource = s; }
                }
                const body = harvesters.length === 0 ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
                spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester', sourceId: bestSource.id } });
            } 
            // Prioridade 2: Suppliers (Essencial para o Harvester não ter que andar)
            else if (suppliers.length < targetSuppliers) {
                spawn.spawnCreep(getBestBody(energyCapacity), 'Supplier' + Game.time, { memory: { role: 'supplier' } });
            }
            // Prioridade 3: Upgraders
            else if (upgraders.length < targetUpgraders) {
                spawn.spawnCreep(getBestBody(energyCapacity), 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') roleHarvester.run(creep);
        if (creep.memory.role == 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role == 'supplier') roleSupplier.run(creep);
    }
}

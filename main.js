const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');

/**
 * Função Inteligente para gerar corpos de creeps (body parts)
 * @param {number} energyLimit Energia máxima que o spawner pode usar
 */
function getBestBody(energyLimit) {
    const parts = [];
    let currentCost = 0;
    const bodySet = [WORK, CARRY, MOVE];
    const setCost = 200; // WORK(100) + CARRY(50) + MOVE(50)

    // Adiciona sets de [WORK, CARRY, MOVE] até atingir o limite de energia
    while (currentCost + setCost <= energyLimit && parts.length < 48) {
        parts.push(...bodySet);
        currentCost += setCost;
    }
    
    // Fallback: se não tiver energia suficiente nem para um set, 
    // retorna o mínimo possível se houver alguma energia (mínimo 200)
    if (parts.length === 0 && energyLimit >= 200) {
        return [WORK, CARRY, MOVE];
    }
    return parts;
}

module.exports.loop = function () {

    // 1. Limpeza de Memória (deleta creeps que morreram)
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Cleaning non-existing creep memory:', name);
        }
    }

    // 2. Spawn Inteligente
    const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

    // Configurações de população (ajuste conforme necessário)
    const MIN_HARVESTERS = 2;
    const MIN_UPGRADERS = 4;

    const spawn = Game.spawns['Spawn1']; // Garanta que o nome do seu spawner é Spawn1
    if (spawn && !spawn.spawning) {
        const energyAvailable = spawn.room.energyAvailable;
        const energyCapacity = spawn.room.energyCapacityAvailable;
        
        // Se temos zero harvesters, spawnamos um básico com a energia ATUAL (emergência)
        if (harvesters.length < MIN_HARVESTERS) {
            const body = harvesters.length === 0 ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
            const newName = 'Harvester' + Game.time;
            spawn.spawnCreep(body, newName, { memory: { role: 'harvester' } });
        } 
        // Se temos harvesters mas faltam upgraders, spawnamos com a capacidade TOTAL da sala
        else if (upgraders.length < MIN_UPGRADERS) {
            const body = getBestBody(energyCapacity);
            const newName = 'Upgrader' + Game.time;
            spawn.spawnCreep(body, newName, { memory: { role: 'upgrader' } });
        }
    }

    // 3. Execução das Roles
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
    }
}

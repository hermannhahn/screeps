const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');

/**
 * Função Inteligente para gerar corpos de creeps (body parts)
 */
function getBestBody(energyLimit) {
    const parts = [];
    let currentCost = 0;
    const bodySet = [WORK, CARRY, MOVE];
    const setCost = 200;

    while (currentCost + setCost <= energyLimit && parts.length < 48) {
        parts.push(...bodySet);
        currentCost += setCost;
    }
    
    if (parts.length === 0 && energyLimit >= 200) {
        return [WORK, CARRY, MOVE];
    }
    return parts;
}

module.exports.loop = function () {

    // 1. Limpeza de Memória
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // 2. Análise da Sala e Definição de Metas
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

        // --- LÓGICA DE POPULAÇÃO AUTOGESTIONADA ---
        
        // HARVESTERS: Precisamos de mais em níveis baixos, menos (porém maiores) em níveis altos.
        // Regra: 2 por fonte em RCL < 3, 1 por fonte em RCL >= 3 (corpos maiores dão conta).
        let targetHarvesters = sources.length * (rcl < 3 ? 2 : 1);
        
        // UPGRADERS: Foco alto no início, estabiliza depois.
        // Regra: RCL 1 = 6, RCL 2 = 4, RCL 3+ = 2.
        let targetUpgraders = 2;
        if (rcl == 1) targetUpgraders = 6;
        else if (rcl == 2) targetUpgraders = 4;

        // BÔNUS DE ENERGIA: Se a sala está com energia máxima, spawnamos um upgrader extra para gastar o excedente.
        if (energyAvailable == energyCapacity && upgraders.length < targetUpgraders + 2) {
            targetUpgraders += 1;
        }

        // --- EXECUÇÃO DO SPAWN ---
        if (!spawn.spawning) {
            // Prioridade 1: Harvesters (Emergência se 0)
            if (harvesters.length < targetHarvesters) {
                // Se não há nenhum harvester, usa a energia atual (emergência). 
                // Se já há algum, espera carregar a capacidade total para fazer um creep melhor.
                const body = harvesters.length === 0 ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
                spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester' } });
            } 
            // Prioridade 2: Upgraders (Apenas se houver harvesters suficientes)
            else if (upgraders.length < targetUpgraders) {
                const body = getBestBody(energyCapacity);
                spawn.spawnCreep(body, 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
            }
        }

        // Visualização no Mapa
        if(spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            room.visual.text(
                '🛠️ ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                {align: 'left', opacity: 0.8}
            );
        }
    }

    // 3. Execução das Roles
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') roleHarvester.run(creep);
        if (creep.memory.role == 'upgrader') roleUpgrader.run(creep);
    }
}

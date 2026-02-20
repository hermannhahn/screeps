const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');
const roleSupplier = require('role.supplier');
const roleBuilder = require('role.builder');
const managerPlanner = require('manager.planner');

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
        
        // --- PLANEJAMENTO DE CONSTRUÇÃO ---
        managerPlanner.run(room);

        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) continue;

        const sources = room.find(FIND_SOURCES);
        const rcl = room.controller.level;
        const energyAvailable = room.energyAvailable;
        const energyCapacity = room.energyCapacityAvailable;
        
        const harvesters = _.filter(Game.creeps, (c) => c.memory.role == 'harvester' && c.room.name == roomName);
        const suppliers = _.filter(Game.creeps, (c) => c.memory.role == 'supplier' && c.room.name == roomName);
        const upgraders = _.filter(Game.creeps, (c) => c.memory.role == 'upgrader' && c.room.name == roomName);
        const builders = _.filter(Game.creeps, (c) => c.memory.role == 'builder' && c.room.name == roomName);

        if (!spawn.spawning) {
            let spawned = false;
            for (let s of sources) {
                const harvestersAtSource = _.filter(harvesters, (h) => h.memory.sourceId == s.id);
                const workParts = _.sum(harvestersAtSource, (h) => h.getActiveBodyparts(WORK));
                if (harvestersAtSource.length === 0 || (workParts < 5 && harvestersAtSource.length < 2)) {
                    const body = harvesters.length === 0 ? getBestBody(energyAvailable) : getBestBody(energyCapacity);
                    spawn.spawnCreep(body, 'Harvester' + Game.time, { memory: { role: 'harvester', sourceId: s.id } });
                    spawned = true;
                    break;
                }
            }
            if (!spawned) {
                if (suppliers.length < sources.length || (harvesters.length > 0 && suppliers.length === 0)) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Supplier' + Game.time, { memory: { role: 'supplier' } });
                }
                else if (upgraders.length < Math.max(1, 4 - rcl) || upgraders.length === 0) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
                }
                else if (room.find(FIND_CONSTRUCTION_SITES).length > 0 && builders.length < 2) {
                    spawn.spawnCreep(getBestBody(energyCapacity), 'Builder' + Game.time, { memory: { role: 'builder' } });
                }
            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') roleHarvester.run(creep);
        if (creep.memory.role == 'upgrader') roleUpgrader.run(creep);
        if (creep.memory.role == 'supplier') roleSupplier.run(creep);
        if (creep.memory.role == 'builder') roleBuilder.run(creep);
    }
}

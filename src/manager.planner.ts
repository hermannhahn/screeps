import { Blueprint } from './blueprints/blueprintInterface';
import spawnRoadsBlueprint from './blueprints/spawnRoads';
import extensionsBlueprint from './blueprints/extensions';
import sourceRoadsBlueprint from './blueprints/sourceRoads';
import controllerRoadsBlueprint from './blueprints/controllerRoads';
import mineralRoadsBlueprint from './blueprints/mineralRoads';
import exitRoadsBlueprint from './blueprints/exitRoads';
import sourceContainersBlueprint from './blueprints/sourceContainers';
import controllerContainerBlueprint from './blueprints/controllerContainer';
import firstTowerBlueprint from './blueprints/firstTower';
import storageBlueprint from './blueprints/storage';
import secondTowerBlueprint from './blueprints/secondTower';
import rampartsWallsBlueprint from './blueprints/rampartsWalls';
import linksBlueprint from './blueprints/links';
import { cacheUtils } from './utils.cache';
import layoutGenerator from './manager.layoutGenerator';

const managerPlanner = {
    run: function(room: Room) {
        // console.log(`[ManagerPlanner] Running for room ${room.name} at tick ${Game.time}`);

        const hostileCreepsInRoom = cacheUtils.getHostiles(room).filter(c => 
            c.getActiveBodyparts(ATTACK) > 0 || 
            c.getActiveBodyparts(RANGED_ATTACK) > 0 || 
            c.getActiveBodyparts(WORK) > 0 ||
            c.getActiveBodyparts(HEAL) > 0
        );
        const damagedStructures = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL, 5);
        const isRoomActivelyUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;

        if (isRoomActivelyUnderAttack) {
            console.log(`[ManagerPlanner] Room ${room.name} actively under attack (Hostiles: ${hostileCreepsInRoom.length}), suspending planning.`);
            return;
        }

        // NOVO PLANNER: Verificar e gerar layout se necessário
        if (!room.memory.layout || !room.memory.layout.generated) {
            const spawns = cacheUtils.findInRoom(room, FIND_MY_SPAWNS);
            if (spawns.length > 0) {
                layoutGenerator.generateLayout(room, spawns[0] as StructureSpawn);
            }
            return; // Retornar após gerar o layout para processá-lo no próximo tick
        }

        // Lógica do NOVO PLANNER: Iterar sobre room.memory.layout e criar CS
        const currentRCL = room.controller ? room.controller.level : 0;
        const plannedStructuresForRCL = room.memory.layout.rcl[currentRCL] || [];
        const totalConstructionSitesInRoom = cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES).length;
        const globalCSCount = Object.keys(Game.constructionSites).length;

        if (globalCSCount >= 100) {
            console.log(`[ManagerPlanner] Global Construction Site limit reached (100). Cannot plan more.`);
            return;
        }

        let sitesCreatedThisTick = 0;
        const maxSitesPerTick = 3; // Limita a criação de CS por tick para não estourar CPU

        for (const planned of plannedStructuresForRCL) {
            if (sitesCreatedThisTick >= maxSitesPerTick) break;

            const pos = new RoomPosition(planned.x, planned.y, room.name);
            
            // Verifica se a estrutura já existe
            const existingStructures = pos.lookFor(LOOK_STRUCTURES);
            const hasExistingStructure = existingStructures.some(s => s.structureType === planned.structureType);

            if (hasExistingStructure) {
                continue; // Já existe, nada a fazer
            }

            // Verifica se já existe um canteiro de obra
            const existingConstructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            const hasExistingCS = existingConstructionSites.some(cs => cs.structureType === planned.structureType);

            if (hasExistingCS) {
                continue; // Já existe um CS, nada a fazer
            }

            // Se não existe estrutura nem CS, cria um ConstructionSite
            const result = room.createConstructionSite(planned.x, planned.y, planned.structureType);
            if (result === OK) {
                sitesCreatedThisTick++;
                console.log(`[ManagerPlanner] Planned ${planned.structureType} at ${planned.x},${planned.y} for RCL ${currentRCL}.`);
            } else if (result !== ERR_INVALID_TARGET && result !== ERR_FULL) { // ERR_INVALID_TARGET pode acontecer em tiles proibidos
                console.log(`[ManagerPlanner] Failed to plan ${planned.structureType} at ${planned.x},${planned.y} (RCL ${currentRCL}): ${result}`);
            }
        }
    }
};

export default managerPlanner;

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

        // TODO: Lógica do NOVO PLANNER (iterar sobre room.memory.layout e criar CS)
        // A lógica antiga foi comentada para evitar conflitos durante a transição.
        /*
        const BLUEPRINTS_ORDER: Blueprint[] = [
            spawnRoadsBlueprint,
            sourceRoadsBlueprint,
            controllerRoadsBlueprint,
            extensionsBlueprint,
            firstTowerBlueprint,
            storageBlueprint,
            sourceContainersBlueprint,
            controllerContainerBlueprint,
            secondTowerBlueprint,
            linksBlueprint,
            rampartsWallsBlueprint,
            mineralRoadsBlueprint,
            exitRoadsBlueprint,
        ];
        const MAX_BLUEPRINT_STAGES = BLUEPRINTS_ORDER.length;

        const spawns = cacheUtils.findInRoom(room, FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0] as StructureSpawn;

        const totalConstructionSites = cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES).length;
        const globalCSCount = Object.keys(Game.constructionSites).length;

        if (globalCSCount >= 100) {
            console.log(`[ManagerPlanner] Global Construction Site limit reached (100). Cannot plan more.`);
            return;
        }

        // Sequential check
        for (let i = 0; i < MAX_BLUEPRINT_STAGES; i++) {
            const currentBlueprint = BLUEPRINTS_ORDER[i];
            const isRoadBlueprint = currentBlueprint.name.toLowerCase().includes('roads');
            
            if (currentBlueprint.isComplete(room, spawn)) {
                continue;
            }

            const csLimit = isRoadBlueprint ? 80 : 20;
            if (totalConstructionSites >= csLimit) {
                continue; 
            }

            let sitesCreated = currentBlueprint.plan(room, spawn);
            
            if (sitesCreated > 0) {
                console.log(`[ManagerPlanner] Planned ${sitesCreated} sites for stage ${i}: ${currentBlueprint.name}`);
                break; 
            } else {
                continue; 
            }
        }
        */
    }
};

export default managerPlanner;

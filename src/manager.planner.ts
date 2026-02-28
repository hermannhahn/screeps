import { Blueprint } from './blueprints/blueprintInterface';
import spawnRoadsBlueprint from './blueprints/spawnRoads';
import extensionsBlueprint from './blueprints/extensions';
import sourceRoadsBlueprint from './blueprints/sourceRoads';
import controllerRoadsBlueprint from './blueprints/controllerRoads';
import mineralRoadsBlueprint from './blueprints/mineralRoads';
import exitRoadsBlueprint from './blueprints/exitRoads'; // Novo import
import sourceContainersBlueprint from './blueprints/sourceContainers';
import controllerContainerBlueprint from './blueprints/controllerContainer';
import firstTowerBlueprint from './blueprints/firstTower';
import storageBlueprint from './blueprints/storage'; // Novo import
import secondTowerBlueprint from './blueprints/secondTower';
import rampartsWallsBlueprint from './blueprints/rampartsWalls';
import linksBlueprint from './blueprints/links'; // Novo import
import { cacheUtils } from './utils.cache';

const managerPlanner = {
    run: function(room: Room) {
        if (Game.time % 20 !== 0) return;

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

        const BLUEPRINTS_ORDER: Blueprint[] = [
            spawnRoadsBlueprint,
            sourceRoadsBlueprint,
            controllerRoadsBlueprint,
            extensionsBlueprint, // Extensions are high priority for energy capacity
            firstTowerBlueprint, // Defense is priority
            storageBlueprint, // Logistics anchor
            sourceContainersBlueprint,
            controllerContainerBlueprint,
            secondTowerBlueprint,
            linksBlueprint,
            rampartsWallsBlueprint,
            mineralRoadsBlueprint, // Only really needed at RCL 6+
            exitRoadsBlueprint, // Connect main network to exits
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

        // SEQUENTIAL REVIEW: Check every blueprint from the start.
        for (let i = 0; i < MAX_BLUEPRINT_STAGES; i++) {
            const currentBlueprint = BLUEPRINTS_ORDER[i];
            const isRoadBlueprint = currentBlueprint.name.toLowerCase().includes('roads');
            
            // If the blueprint is already 'Complete', move to next
            if (currentBlueprint.isComplete(room, spawn)) {
                continue;
            }

            // Blueprint is NOT complete. Try to plan it.
            const csLimit = isRoadBlueprint ? 80 : 20;
            if (totalConstructionSites >= csLimit) {
                // console.log(`[ManagerPlanner] Stage ${i} (${currentBlueprint.name}) skipped: too many CS (${totalConstructionSites}/${csLimit})`);
                continue; 
            }

            let sitesCreated = currentBlueprint.plan(room, spawn);
            
            if (sitesCreated > 0) {
                console.log(`[ManagerPlanner] Planned ${sitesCreated} sites for stage ${i}: ${currentBlueprint.name}`);
                room.memory.currentBlueprintStage = i;
                break; 
            } else {
                // console.log(`[ManagerPlanner] Stage ${i} (${currentBlueprint.name}) is incomplete but planned 0 sites.`);
                continue; 
            }
        }
    }
};

export default managerPlanner;

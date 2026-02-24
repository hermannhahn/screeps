import { Blueprint } from './blueprints/blueprintInterface';
import spawnRoadsBlueprint from './blueprints/spawnRoads';
import extensionsBlueprint from './blueprints/extensions';
import sourceRoadsBlueprint from './blueprints/sourceRoads';
import controllerRoadsBlueprint from './blueprints/controllerRoads';
import mineralRoadsBlueprint from './blueprints/mineralRoads';
import sourceContainersBlueprint from './blueprints/sourceContainers';
import controllerContainerBlueprint from './blueprints/controllerContainer';
import firstTowerBlueprint from './blueprints/firstTower';
import storageBlueprint from './blueprints/storage'; // Novo import
import secondTowerBlueprint from './blueprints/secondTower';
import rampartsWallsBlueprint from './blueprints/rampartsWalls';
import linksBlueprint from './blueprints/links'; // Novo import

const managerPlanner = {
    run: function(room: Room) {
        if (Game.time % 20 !== 0) return;

        const hostileCreepsInRoom = room.find(FIND_HOSTILE_CREEPS);
        const damagedStructures = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax
        });
        const isRoomActivelyUnderAttack = hostileCreepsInRoom.length > 0 && damagedStructures.length > 0;

        if (isRoomActivelyUnderAttack) {
            console.log(`Room ${room.name} actively under attack, suspending planning.`);
            return;
        }

        if (room.memory.maxBlueprintStageCompleted === undefined) {
            room.memory.maxBlueprintStageCompleted = -1; // -1 indicates no blueprint has been completed yet
        }
        if (room.memory.currentBlueprintStage === undefined) {
            room.memory.currentBlueprintStage = 0; // Start checking from blueprint 0
        }

        const BLUEPRINTS_ORDER: Blueprint[] = [
            spawnRoadsBlueprint,
            extensionsBlueprint,
            sourceRoadsBlueprint,
            controllerRoadsBlueprint,
            mineralRoadsBlueprint,
            sourceContainersBlueprint,
            controllerContainerBlueprint,
            firstTowerBlueprint,
            storageBlueprint,
            secondTowerBlueprint,
            rampartsWallsBlueprint,
            linksBlueprint,
        ];
        const MAX_BLUEPRINT_STAGES = BLUEPRINTS_ORDER.length;

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 20) { 
            // Avoid flooding the room with too many sites at once.
            // 20 is a safe limit to keep builders busy but focused.
            return;
        }

        // NEW LOGIC: Iterate through blueprints. Plan the first one that is incomplete and CAN be planned.
        let plannedSomething = false;

        for (let i = 0; i < MAX_BLUEPRINT_STAGES; i++) {
            const currentBlueprint = BLUEPRINTS_ORDER[i];
            
            if (!currentBlueprint.isComplete(room, spawn)) {
                // Stage is incomplete, try to plan it
                let sitesCreated = currentBlueprint.plan(room, spawn);
                
                if (sitesCreated > 0) {
                    console.log(`[ManagerPlanner] Planned ${sitesCreated} sites for stage ${i}: ${currentBlueprint.name}`);
                    room.memory.currentBlueprintStage = i;
                    plannedSomething = true;
                    break; // Stop after planning one blueprint to avoid flooding
                } else {
                    // Stage is incomplete but couldn't be planned (e.g. unsafe)
                    // We continue the loop to check if later stages can be planned
                    // console.log(`[ManagerPlanner] Stage ${i} (${currentBlueprint.name}) is incomplete but could not be planned. Checking next stages...`);
                }
            }
        }

        if (!plannedSomething) {
            // console.log(`[ManagerPlanner] No planning needed or possible in Room ${room.name}`);
        }
    }
};

export default managerPlanner;

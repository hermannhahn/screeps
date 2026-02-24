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
            console.log(`[ManagerPlanner] Room ${room.name} actively under attack, suspending planning.`);
            return;
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

        const totalConstructionSites = room.find(FIND_CONSTRUCTION_SITES).length;

        // SEQUENTIAL REVIEW: Check every blueprint from the start.
        for (let i = 0; i < MAX_BLUEPRINT_STAGES; i++) {
            const currentBlueprint = BLUEPRINTS_ORDER[i];
            
            // If the blueprint is already 'Complete' (built, planned, or N/A due to RCL), move to next
            if (currentBlueprint.isComplete(room, spawn)) {
                continue;
            }

            // Blueprint is NOT complete. Try to plan it.
            if (totalConstructionSites >= 20) {
                // console.log(`[ManagerPlanner] Stage ${i} (${currentBlueprint.name}) is incomplete, but room has too many construction sites (${totalConstructionSites}). Waiting...`);
                break; // Stop reviewing once we hit a block
            }

            let sitesCreated = currentBlueprint.plan(room, spawn);
            
            if (sitesCreated > 0) {
                console.log(`[ManagerPlanner] Planned ${sitesCreated} sites for stage ${i}: ${currentBlueprint.name}`);
                room.memory.currentBlueprintStage = i;
                break; // Stop after planning one blueprint to avoid flooding and maintain order
            } else {
                // Stage is incomplete but could not be planned.
                // This could be due to RCL, unsafe conditions, or no valid spots found.
                // We STOP here to maintain sequential integrity: don't build stage N+1 if stage N is broken and unfixable.
                // console.log(`[ManagerPlanner] Stage ${i} (${currentBlueprint.name}) is incomplete and could not be planned. Sequential stop.`);
                break;
            }
        }
    }
};

export default managerPlanner;

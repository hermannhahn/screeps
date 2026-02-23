import { Blueprint } from './blueprints/blueprintInterface';
import spawnRoadsBlueprint from './blueprints/spawnRoads';
import extensionsBlueprint from './blueprints/extensions';
import sourceRoadsBlueprint from './blueprints/sourceRoads';
import controllerRoadsBlueprint from './blueprints/controllerRoads';
import mineralRoadsBlueprint from './blueprints/mineralRoads';
import sourceContainersBlueprint from './blueprints/sourceContainers';
import firstTowerBlueprint from './blueprints/firstTower';
import secondTowerBlueprint from './blueprints/secondTower';
import rampartsWallsBlueprint from './blueprints/rampartsWalls'; // Novo import

const managerPlanner = {
    run: function(room: Room) {
        if (Game.time % 100 !== 0) return;

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
            firstTowerBlueprint, // New blueprint
            secondTowerBlueprint, // Nova blueprint adicionada ao final
            rampartsWallsBlueprint, // Nova blueprint adicionada
        ];
        const MAX_BLUEPRINT_STAGES = BLUEPRINTS_ORDER.length;

        let currentBlueprintStage = room.memory.currentBlueprintStage;
        const nextBlueprintToPlanName = BLUEPRINTS_ORDER[currentBlueprintStage] ? BLUEPRINTS_ORDER[currentBlueprintStage].name : `Unknown Blueprint (${currentBlueprintStage})`;

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) { // Only create new blueprints if no existing construction sites
            console.log(`Room ${room.name} has ${constructionSites.length} construction sites. Current blueprint: ${nextBlueprintToPlanName}. Suspending new blueprint creation.`);
            return;
        }

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        // Loop currentBlueprintStage for continuous review if all blueprints are completed
        // or ensure it stays within valid blueprint indices
        if (room.memory.currentBlueprintStage >= MAX_BLUEPRINT_STAGES) {
            room.memory.currentBlueprintStage = 0; // Loop back to start for continuous review
        }

        let sitesCreatedThisTick = 0;
        const currentBlueprint = BLUEPRINTS_ORDER[room.memory.currentBlueprintStage];

        if (currentBlueprint) { // Ensure blueprint exists
            sitesCreatedThisTick = currentBlueprint.plan(room, spawn);

            // If no sites were created by the planning function, check for completion
            // If it's complete, advance the currentBlueprintStage
            if (sitesCreatedThisTick === 0) {
                // Check if the current stage is actually complete (all structures built, no CS)
                if (currentBlueprint.isComplete(room, spawn)) {
                    // If we completed a *new* blueprint stage (i.e., it was not just a review of an existing one)
                    if (room.memory.currentBlueprintStage === room.memory.maxBlueprintStageCompleted + 1) {
                        room.memory.maxBlueprintStageCompleted = room.memory.currentBlueprintStage;
                    }
                    room.memory.currentBlueprintStage++;
                }
            }
        } else {
            console.log(`[ManagerPlanner] No blueprint found for stage ${room.memory.currentBlueprintStage}. Resetting to 0.`);
            room.memory.currentBlueprintStage = 0; // Fallback in case of undefined blueprint
        }
    }
};

export default managerPlanner;

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
            controllerContainerBlueprint,
            firstTowerBlueprint,
            storageBlueprint,       // Adicionado aqui
            secondTowerBlueprint,
            rampartsWallsBlueprint,
            linksBlueprint, // Nova blueprint adicionada
        ];
        const MAX_BLUEPRINT_STAGES = BLUEPRINTS_ORDER.length;

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        // NEW LOGIC: Always check from the beginning to see if anything needs to be rebuilt
        let foundIncompleteStage = -1;
        for (let i = 0; i < MAX_BLUEPRINT_STAGES; i++) {
            if (!BLUEPRINTS_ORDER[i].isComplete(room, spawn)) {
                foundIncompleteStage = i;
                break;
            }
        }

        // If everything is complete, we can still run a loop to verify (redundant but safe)
        if (foundIncompleteStage === -1) {
            // console.log(`Room ${room.name}: All blueprints completed and verified.`);
            room.memory.currentBlueprintStage = 0; // Reset to 0 for next check cycle
            return;
        }

        // Update current stage to the first incomplete one
        room.memory.currentBlueprintStage = foundIncompleteStage;
        const currentBlueprint = BLUEPRINTS_ORDER[foundIncompleteStage];
        const nextBlueprintToPlanName = currentBlueprint.name;

        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) { 
            console.log(`Room ${room.name} has ${constructionSites.length} construction sites. Current blueprint being built: ${nextBlueprintToPlanName}.`);
            return;
        }

        console.log(`[ManagerPlanner] Planning stage ${foundIncompleteStage}: ${nextBlueprintToPlanName}`);
        let sitesCreatedThisTick = currentBlueprint.plan(room, spawn);

        if (sitesCreatedThisTick === 0) {
            // This case shouldn't happen often if isComplete and plan are consistent,
            // but it acts as a safeguard.
            if (currentBlueprint.isComplete(room, spawn)) {
                room.memory.currentBlueprintStage++;
            }
        }
    }
};

export default managerPlanner;

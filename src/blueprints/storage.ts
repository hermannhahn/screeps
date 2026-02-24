import { Blueprint } from './blueprintInterface';

const storageBlueprint: Blueprint = {
    name: "Storage",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || room.controller.level < 4) return 0;
        
        // 1. Verificar se já existe um STRUCTURE_STORAGE ou CONSTRUCTION_SITE
        const existingStorage = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_STORAGE
        });
        const existingStorageCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_STORAGE
        });

        if (existingStorage.length > 0 || existingStorageCS.length > 0) {
            return 0; // Já existe ou está em planejamento
        }

        let sitesCreated = 0;
        let foundPos: RoomPosition | null = null;

        // 3. Procurar uma posição adequada perto do spawn
        // Começa procurando adjacente (range 1), depois range 2
        for (let range = 1; range <= 2; range++) { // Tenta range 1 e 2
            // Use local coordinates around spawn instead of FIND_MY_CREEPS hack
            for (let dx = -range; dx <= range; dx++) {
                for (let dy = -range; dy <= range; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    if (Math.abs(dx) < range && Math.abs(dy) < range && range > 1) continue;

                    const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, room.name);
                    
                    if (pos.isWalkable()) {
                        const structures = pos.lookFor(LOOK_STRUCTURES);
                        if (structures.length > 0) continue;
                        
                        const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                        if (constructionSites.length > 0) continue;

                        foundPos = pos;
                        break;
                    }
                }
                if (foundPos) break;
            }
            if (foundPos) break;
        }


        if (foundPos) {
            if (room.createConstructionSite(foundPos, STRUCTURE_STORAGE) === OK) {
                console.log(`[ManagerPlanner] Created Storage CS at ${foundPos}`);
                sitesCreated++;
            }
        }
        
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // If RCL is too low, we don't consider this stage "incomplete" for the purpose of the main loop
        if (!room.controller || room.controller.level < 4) return true;

        // 1. Verificar se existe pelo menos um STRUCTURE_STORAGE na sala
        const existingStorage = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_STORAGE
        });

        if (existingStorage.length > 0) {
            return true; // Storage construído
        }

        // 2. Verificar se há CONSTRUCTION_SITE para STRUCTURE_STORAGE na sala
        const existingStorageCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_STORAGE
        });

        if (existingStorageCS.length > 0) {
            return true; // Ainda há construction sites para storage, so it's "in progress"
        }

        return false; // Not built and no CS
    }
};

export default storageBlueprint;
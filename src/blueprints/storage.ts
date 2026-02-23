import { Blueprint } from './blueprintInterface';

const storageBlueprint: Blueprint = {
    name: "Storage",

    plan: function(room: Room, spawn: StructureSpawn): number {
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
            const positionsInRange = spawn.pos.findInRange(FIND_MY_CREEPS, range, { filter: (c) => false }) as any[]; // Truque para pegar posições no range
            
            for (let i = 0; i < positionsInRange.length; i++) {
                const pos = positionsInRange[i].pos || positionsInRange[i]; // Garantir que é RoomPosition
                
                if (pos.isWalkable()) { // Usar a função isWalkable
                    // Verificar se a posição não está ocupada por estruturas existentes
                    const structures = pos.lookFor(LOOK_STRUCTURES);
                    if (structures.length > 0) continue;
                    
                    // Verificar se a posição não está ocupada por construction sites existentes
                    const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                    if (constructionSites.length > 0) continue;

                    foundPos = pos;
                    break;
                }
            }
            if (foundPos) break;
        }


        if (foundPos) {
            if (room.createConstructionSite(foundPos, STRUCTURE_STORAGE) === OK) {
                sitesCreated++;
            }
        }
        
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // 1. Verificar se existe pelo menos um STRUCTURE_STORAGE na sala
        const existingStorage = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_STORAGE
        });

        if (existingStorage.length === 0) {
            return false; // Nenhum storage construído
        }

        // 2. Verificar se não há CONSTRUCTION_SITE para STRUCTURE_STORAGE na sala
        const existingStorageCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_STORAGE
        });

        if (existingStorageCS.length > 0) {
            return false; // Ainda há construction sites para storage
        }

        return true; // Storage construído e sem construction sites pendentes
    }
};

export default storageBlueprint;
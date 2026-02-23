import { Blueprint } from './blueprintInterface';

const secondTowerBlueprint: Blueprint = {
    name: "Second Tower",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // 1. Verificar se o RCL é pelo menos 4
        if (!room.controller || room.controller.level < 4) {
            return 0; // RCL 4 é necessário para a segunda torre
        }

        // 2. Verificar se já existem 2 torres construídas ou em CONSTRUCTION_SITE
        const existingTowers = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER
        });
        const existingTowerCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_TOWER
        });

        if (existingTowers.length + existingTowerCS.length >= 2) {
            return 0; // Já existem 2 ou mais torres/CS
        }

        let sitesCreated = 0;
        let foundPos: RoomPosition | null = null;
        const firstTower = existingTowers[0]; // Assumindo que a primeira torre já existe

        // 4. Encontrar um local adequado para a segunda torre.
        // Tentar posicionar a segunda torre a uma distância razoável do spawn e da primeira torre
        for (let range = 1; range <= 3; range++) { // Tenta range 1, 2 e 3 do spawn
            const positionsInRange = spawn.pos.findInRange(FIND_MY_CREEPS, range, { filter: (c) => false }) as any[];
            
            for (let i = 0; i < positionsInRange.length; i++) {
                const pos = positionsInRange[i].pos || positionsInRange[i];
                
                // Evitar a posição da primeira torre, se ela existir
                if (firstTower && pos.isEqualTo(firstTower.pos)) {
                    continue;
                }
                // Evitar a posição do spawn
                if (pos.isEqualTo(spawn.pos)) {
                    continue;
                }

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
            if (room.createConstructionSite(foundPos, STRUCTURE_TOWER) === OK) {
                sitesCreated++;
            }
        }
        
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // 1. Verificar se o RCL é pelo menos 4
        if (!room.controller || room.controller.level < 4) {
            return true; // Não aplicável ou muito cedo, consideramos completa para não bloquear o planner
        }

        // 2. Verificar se existem 2 torres construídas na sala
        const builtTowers = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER
        });

        if (builtTowers.length < 2) {
            return false; // Menos de 2 torres construídas
        }

        // 3. Verificar se não há CONSTRUCTION_SITE para STRUCTURE_TOWER na sala
        const existingTowerCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_TOWER
        });

        if (existingTowerCS.length > 0) {
            return false; // Ainda há construction sites para torres
        }

        return true; // 2 torres construídas e sem construction sites pendentes
    }
};

export default secondTowerBlueprint;
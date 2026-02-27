import { Blueprint } from './blueprintInterface';

const secondTowerBlueprint: Blueprint = {
    name: "Second Tower",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // 1. Verificar se o RCL é pelo menos 5
        if (!room.controller || room.controller.level < 5) {
            return 0; // RCL 5 é necessário para a segunda torre
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
        // Tentar posicionar a segunda torre a uma distância razoável do spawn
        // Procurar em um raio de 2 a 5 do spawn
        for (let range = 2; range <= 5; range++) { 
            for (let dx = -range; dx <= range; dx++) {
                for (let dy = -range; dy <= range; dy++) {
                    if (Math.abs(dx) < range && Math.abs(dy) < range) continue; // Skip inner ranges

                    const x = spawn.pos.x + dx;
                    const y = spawn.pos.y + dy;

                    if (x < 1 || x > 48 || y < 1 || y > 48) continue;
                    const pos = new RoomPosition(x, y, room.name);

                    // Evitar a posição da primeira torre, se ela existir
                    if (firstTower && pos.getRangeTo(firstTower.pos) < 2) {
                        continue;
                    }
                    // Evitar a posição do spawn
                    if (pos.getRangeTo(spawn.pos) < 2) {
                        continue;
                    }

                    if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

                    // Verificar se a posição não está ocupada por estruturas existentes
                    const structures = pos.lookFor(LOOK_STRUCTURES);
                    if (structures.length > 0) continue;
                    
                    // Verificar se a posição não está ocupada por construction sites existentes
                    const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                    if (constructionSites.length > 0) continue;

                    foundPos = pos;
                    break;
                }
                if (foundPos) break;
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
        // 1. Verificar se o RCL é pelo menos 5
        if (!room.controller || room.controller.level < 5) {
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
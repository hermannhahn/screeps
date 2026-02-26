import { Blueprint } from './blueprintInterface';

const rampartsWallsBlueprint: Blueprint = {
    name: "Ramparts and Walls",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // Only plan Ramparts and Walls if there is at least one tower built
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });
        if (towers.length === 0) {
            return 0;
        }

        let sitesCreated = 0;

        // Limite de Ramparts para RCL 3 é 10. Em RCL 4, 25.
        // Vamos planejar para o máximo disponível no RCL atual.
        const maxRamparts = CONTROLLER_STRUCTURES[STRUCTURE_RAMPART][room.controller?.level || 1];
        let currentRamparts = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_RAMPART } }).length;
        let currentRampartCS = room.find(FIND_CONSTRUCTION_SITES, { filter: { structureType: STRUCTURE_RAMPART } }).length;

        if (currentRamparts + currentRampartCS >= maxRamparts) {
            return 0; // Já temos o número máximo de ramparts para o RCL atual
        }

        const structuresToProtect = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN ||
                            s.structureType === STRUCTURE_EXTENSION ||
                            s.structureType === STRUCTURE_TOWER ||
                            s.structureType === STRUCTURE_CONTROLLER) // Proteger também o controller
        });

        for (const structure of structuresToProtect) {
            if (sitesCreated + currentRamparts + currentRampartCS >= maxRamparts) break; // Não exceder o limite de ramparts

            const adjacentPositions = structure.pos.getAdjacentPositions(); // Usar a função de protótipo

            for (const pos of adjacentPositions) {
                // Verificar se já existe um Rampart, Wall ou CS correspondente na posição
                const existingStructure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL);
                const existingCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(cs => cs.structureType === STRUCTURE_RAMPART || cs.structureType === STRUCTURE_WALL);

                if (existingStructure || existingCS) {
                    continue; // Já tem uma estrutura defensiva ou CS aqui
                }

                // Decidir entre Wall ou Rampart: se houver uma estrada, DEVE ser um Rampart
                const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
                const structureType = hasRoad ? STRUCTURE_RAMPART : STRUCTURE_WALL;

                // Se for planejar um Rampart, verificar se não excedemos o limite do RCL
                if (structureType === STRUCTURE_RAMPART) {
                    if (sitesCreated + currentRamparts + currentRampartCS >= maxRamparts) {
                        continue; 
                    }
                }

                // Criar Construction Site
                if (room.createConstructionSite(pos, structureType) === OK) {
                    sitesCreated++;
                    if (structureType === STRUCTURE_RAMPART) {
                        currentRampartCS++;
                    }
                }
            }
        }

        // --- DEFESA DE PERÍMETRO (CHOKE POINTS) ---
        // Identifica saídas e planeja bloqueios a 2 tiles de distância
        if (sitesCreated < 10) { // Só planeja perímetro se não tiver muitos CS ativos
            const terrain = room.getTerrain();
            const exits = room.find(FIND_EXIT);
            const blockedPositions = new Set<string>();

            for (const exitPos of exits) {
                // Determina a direção do bloqueio (2 tiles para dentro da sala)
                let bx = exitPos.x;
                let by = exitPos.y;

                if (bx === 0) bx = 2;
                else if (bx === 49) bx = 47;
                if (by === 0) by = 2;
                else if (by === 49) by = 47;

                const pos = new RoomPosition(bx, by, room.name);
                const key = `${pos.x},${pos.y}`;
                if (blockedPositions.has(key)) continue;

                // Verifica se a posição é passável antes de bloquear
                if (terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL) {
                    const existingStructure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL);
                    const existingCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(cs => cs.structureType === STRUCTURE_RAMPART || cs.structureType === STRUCTURE_WALL);

                    if (!existingStructure && !existingCS) {
                        const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
                        const type = hasRoad ? STRUCTURE_RAMPART : STRUCTURE_WALL;

                        if (type === STRUCTURE_RAMPART && (sitesCreated + currentRamparts + currentRampartCS >= maxRamparts)) {
                            continue;
                        }

                        if (room.createConstructionSite(pos, type) === OK) {
                            sitesCreated++;
                            if (type === STRUCTURE_RAMPART) currentRampartCS++;
                            blockedPositions.add(key);
                        }
                    }
                }
            }
        }

        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // If there are no towers, we skip this blueprint for now (consider it "complete" so the planner advances)
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });
        if (towers.length === 0) {
            return true;
        }

        // Obter o número máximo de Ramparts permitidos para o RCL atual
        const maxRamparts = CONTROLLER_STRUCTURES[STRUCTURE_RAMPART][room.controller?.level || 1];

        // Contar Ramparts construídos
        const builtRamparts = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_RAMPART }
        }).length;

        // Contar Construction Sites de Ramparts
        const rampartConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: { structureType: STRUCTURE_RAMPART }
        }).length;

        // A blueprint está completa se o número total de ramparts (construídos + CS) atingir o máximo
        return (builtRamparts + rampartConstructionSites >= maxRamparts);
    }
};

export default rampartsWallsBlueprint;
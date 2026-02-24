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
                if (sitesCreated + currentRamparts + currentRampartCS >= maxRamparts) break; // Não exceder o limite

                // Verificar se já existe um Rampart ou CS de Rampart na posição
                const existingRampart = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART);
                const existingRampartCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(cs => cs.structureType === STRUCTURE_RAMPART);

                if (existingRampart || existingRampartCS) {
                    continue; // Já tem um rampart ou CS aqui
                }

                // Criar Construction Site para Rampart
                if (room.createConstructionSite(pos, STRUCTURE_RAMPART) === OK) {
                    sitesCreated++;
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
        // E não houver construction sites pendentes.
        return (builtRamparts + rampartConstructionSites >= maxRamparts) && (rampartConstructionSites === 0);
    }
};

export default rampartsWallsBlueprint;
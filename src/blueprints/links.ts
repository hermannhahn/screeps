import { Blueprint } from './blueprintInterface';

const linksBlueprint: Blueprint = {
    name: "Links",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // 1. Verificar se o RCL é pelo menos 5
        if (!room.controller || room.controller.level < 5) {
            return 0; // RCL 5 é necessário para links
        }

        // 2. Contar links existentes e em construção
        const existingLinks = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK
        });
        const existingLinkCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_LINK
        });

        let totalLinksPlanned = existingLinks.length + existingLinkCS.length;
        const maxLinks = CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level]; // Max links para o RCL 5

        if (totalLinksPlanned >= maxLinks) {
            return 0; // Já temos o número máximo de links
        }

        let sitesCreated = 0;

        // Planejar o Link do Controller
        if (room.controller && totalLinksPlanned < maxLinks) {
            const hasControllerLink = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                filter: (s) => s.structureType === STRUCTURE_LINK
            }).length > 0 || room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                filter: (cs) => cs.structureType === STRUCTURE_LINK
            }).length > 0;

            if (!hasControllerLink) {
                const controllerLinkPos = room.controller.pos.findAdjacentWalkableSpot();
                if (controllerLinkPos) {
                    if (room.createConstructionSite(controllerLinkPos, STRUCTURE_LINK) === OK) {
                        sitesCreated++;
                        totalLinksPlanned++;
                    }
                }
            }
        }

        // Planejar Links para as Fontes
        if (totalLinksPlanned < maxLinks) {
            const sources = room.find(FIND_SOURCES);
            // Ordenar fontes por distância ao spawn para priorizar a mais próxima
            const sortedSources = _.sortBy(sources, s => spawn.pos.getRangeTo(s));

            for (const source of sortedSources) {
                if (totalLinksPlanned >= maxLinks) break;

                const hasSourceLink = source.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                    filter: (s) => s.structureType === STRUCTURE_LINK
                }).length > 0 || source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                    filter: (cs) => cs.structureType === STRUCTURE_LINK
                }).length > 0;

                if (!hasSourceLink) {
                    const sourceLinkPos = source.pos.findAdjacentWalkableSpot();
                    if (sourceLinkPos) {
                        if (room.createConstructionSite(sourceLinkPos, STRUCTURE_LINK) === OK) {
                            sitesCreated++;
                            totalLinksPlanned++;
                        }
                    }
                }
            }
        }
        
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // 1. Verificar se o RCL é pelo menos 5
        if (!room.controller || room.controller.level < 5) {
            return true; // Não aplicável ou muito cedo, consideramos completa para não bloquear o planner
        }

        // 2. Verificar se existem o número máximo de links construídos na sala (2 para RCL 5)
        const builtLinks = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK
        });
        const maxLinks = CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level];

        if (builtLinks.length < maxLinks) {
            return false; // Não atingiu o número máximo de links
        }

        // 3. Verificar se não há CONSTRUCTION_SITE para STRUCTURE_LINK na sala
        const existingLinkCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_LINK
        });

        if (existingLinkCS.length > 0) {
            return false; // Ainda há construction sites para links
        }

        return true; // Links construídos e sem construction sites pendentes
    }
};

export default linksBlueprint;
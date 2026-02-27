import _ from 'lodash';
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

        // Planejar o Link do Controller - PRIORIDADE MÁXIMA
        if (room.controller) {
            const hasControllerLink = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                filter: (s) => s.structureType === STRUCTURE_LINK
            }).length > 0 || room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                filter: (cs) => cs.structureType === STRUCTURE_LINK
            }).length > 0;

            if (!hasControllerLink && totalLinksPlanned < maxLinks) {
                // Tenta encontrar um lugar livre em range 1 ou 2
                let foundPos: RoomPosition | null = null;
                const terrain = room.getTerrain();

                for (let r = 1; r <= 2; r++) {
                    for (let dx = -r; dx <= r; dx++) {
                        for (let dy = -r; dy <= r; dy++) {
                            // Only check perimeter of the range square to avoid redundant checks
                            if (r > 1 && Math.abs(dx) < r && Math.abs(dy) < r) continue;

                            const x = room.controller.pos.x + dx;
                            const y = room.controller.pos.y + dy;
                            if (x < 1 || x > 48 || y < 1 || y > 48) continue;

                            // Check terrain
                            if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

                            const pos = new RoomPosition(x, y, room.name);
                            
                            // Check for blocking structures (anything except roads and ramparts)
                            const structures = pos.lookFor(LOOK_STRUCTURES);
                            const hasBlockingStructure = _.some(structures, (s) => 
                                s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART
                            );
                            if (hasBlockingStructure) continue;

                            const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                            const hasBlockingCS = _.some(constructionSites, (cs) => 
                                cs.structureType !== STRUCTURE_ROAD && cs.structureType !== STRUCTURE_RAMPART
                            );
                            if (hasBlockingCS) continue;

                            foundPos = pos;
                            break;
                        }
                        if (foundPos) break;
                    }
                    if (foundPos) break;
                }

                if (foundPos) {
                    // Se houver uma estrada no local, destruí-la para dar lugar ao link
                    const road = foundPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
                    if (road) {
                        console.log(`[ManagerPlanner] Destroying road at ${foundPos} to place Link.`);
                        road.destroy();
                    }

                    if (room.createConstructionSite(foundPos, STRUCTURE_LINK) === OK) {
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
                    const terrain = room.getTerrain();
                    let foundPos: RoomPosition | null = null;

                    // Try range 1 around source
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            const x = source.pos.x + dx;
                            const y = source.pos.y + dy;
                            if (x < 1 || x > 48 || y < 1 || y > 48) continue;

                            if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;

                            const pos = new RoomPosition(x, y, room.name);

                            // Check for blocking structures
                            const structures = pos.lookFor(LOOK_STRUCTURES);
                            const hasBlockingStructure = _.some(structures, (s) => 
                                s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART
                            );
                            if (hasBlockingStructure) continue;

                            const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                            const hasBlockingCS = _.some(constructionSites, (cs) => 
                                cs.structureType !== STRUCTURE_ROAD && cs.structureType !== STRUCTURE_RAMPART
                            );
                            if (hasBlockingCS) continue;

                            foundPos = pos;
                            break;
                        }
                        if (foundPos) break;
                    }

                    if (foundPos) {
                        // Se houver uma estrada no local, destruí-la
                        const road = foundPos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
                        if (road) {
                            console.log(`[ManagerPlanner] Destroying road at ${foundPos} to place Source Link.`);
                            road.destroy();
                        }

                        if (room.createConstructionSite(foundPos, STRUCTURE_LINK) === OK) {
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

        // 2. Verificar se o link do controller está presente ou planejado
        const hasControllerLink = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2, {
            filter: (s) => s.structureType === STRUCTURE_LINK
        }).length > 0 || room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
            filter: (cs) => cs.structureType === STRUCTURE_LINK
        }).length > 0;

        if (!hasControllerLink) {
            return false;
        }

        // 3. Verificar se existem o número máximo de links construídos na sala (2 para RCL 5)
        const builtLinks = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK
        });
        const maxLinks = CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level];

        if (builtLinks.length < maxLinks) {
            return false; // Não atingiu o número máximo de links
        }

        // 4. Verificar se não há CONSTRUCTION_SITE para STRUCTURE_LINK na sala
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
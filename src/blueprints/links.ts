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

        // 1. Obter fontes ordenadas por distância ao spawn
        const sources = room.find(FIND_SOURCES);
        const sortedSources = _.sortBy(sources, s => spawn.pos.getRangeTo(s));

        // 2. Definir alvos na ordem de prioridade solicitada
        // Prio 1: Primeira Fonte (mais próxima ao spawn)
        // Prio 2: Storage
        // Prio 3: Segunda Fonte (se existir)
        // Prio 4: Controller
        const priorityTargets: { pos: RoomPosition, name: string }[] = [];

        // Adicionar Primeira Fonte
        if (sortedSources.length > 0) {
            priorityTargets.push({ pos: sortedSources[0].pos, name: "Source 0" });
        }

        // Adicionar Storage (RCL 4+ necessário para o Storage existir)
        if (room.storage) {
            priorityTargets.push({ pos: room.storage.pos, name: "Storage" });
        }

        // Adicionar Segunda Fonte
        if (sortedSources.length > 1) {
            priorityTargets.push({ pos: sortedSources[1].pos, name: "Source 1" });
        }

        // Adicionar Controller
        if (room.controller) {
            priorityTargets.push({ pos: room.controller.pos, name: "Controller" });
        }

        // 3. Tentar planejar links para os alvos na ordem de prioridade
        for (const target of priorityTargets) {
            if (totalLinksPlanned >= maxLinks) break;

            const hasLink = target.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                filter: (s) => s.structureType === STRUCTURE_LINK
            }).length > 0 || target.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                filter: (cs) => cs.structureType === STRUCTURE_LINK
            }).length > 0;

            if (!hasLink) {
                const terrain = room.getTerrain();
                let foundPos: RoomPosition | null = null;

                // Tentar encontrar uma posição livre em range 1 ou 2 (ou 3 para Storage/Controller se necessário)
                const isSource = target.name.startsWith("Source");
                const maxRange = isSource ? 1 : 3;

                for (let r = 1; r <= maxRange; r++) {
                    for (let dx = -r; dx <= r; dx++) {
                        for (let dy = -r; dy <= r; dy++) {
                            if (r > 1 && Math.abs(dx) < r && Math.abs(dy) < r) continue;

                            const x = target.pos.x + dx;
                            const y = target.pos.y + dy;
                            if (x < 1 || x > 48 || y < 1 || y > 48) continue;

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
                        console.log(`[ManagerPlanner] Destroying road at ${foundPos} to place Link for ${target.name}.`);
                        road.destroy();
                    }

                    if (room.createConstructionSite(foundPos, STRUCTURE_LINK) === OK) {
                        console.log(`[ManagerPlanner] Planned Link for ${target.name} at ${foundPos}`);
                        sitesCreated++;
                        totalLinksPlanned++;
                    }
                } else {
                    console.log(`[ManagerPlanner] Could not find valid position for Link near ${target.name} at range ${maxRange}.`);
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

        // 2. Contar links construídos
        const builtLinks = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_LINK
        });
        const maxLinks = CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level];

        // 3. Obter alvos prioritários que deveriam ter links (limitados pelo maxLinks atual)
        const sources = room.find(FIND_SOURCES);
        const sortedSources = _.sortBy(sources, s => spawn.pos.getRangeTo(s));
        
        const priorityTargets: RoomPosition[] = [];
        if (sortedSources.length > 0) priorityTargets.push(sortedSources[0].pos);
        if (room.storage) priorityTargets.push(room.storage.pos);
        if (sortedSources.length > 1) priorityTargets.push(sortedSources[1].pos);
        if (room.controller) priorityTargets.push(room.controller.pos);

        // Só verificamos os primeiros N alvos, onde N é maxLinks
        const targetsToVerify = priorityTargets.slice(0, maxLinks);

        for (const targetPos of targetsToVerify) {
            const hasBuiltLink = targetPos.findInRange(FIND_MY_STRUCTURES, 2, {
                filter: (s) => s.structureType === STRUCTURE_LINK
            }).length > 0;

            if (!hasBuiltLink) {
                return false; // Falta um link prioritário
            }
        }

        // 4. Verificar se não há CONSTRUCTION_SITE pendente
        const existingLinkCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => cs.structureType === STRUCTURE_LINK
        });

        if (existingLinkCS.length > 0) {
            return false; // Ainda há construction sites para links
        }

        return true; 
    }

};

export default linksBlueprint;
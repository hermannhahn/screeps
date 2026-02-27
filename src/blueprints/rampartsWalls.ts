import { Blueprint } from './blueprintInterface';
import { cacheUtils } from '../utils.cache';

const rampartsWallsBlueprint: Blueprint = {
    name: "Ramparts and Walls",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // Only plan Ramparts and Walls if there is at least one tower built
        const towers = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_TOWER);
        if (towers.length === 0) {
            return 0;
        }

        let sitesCreated = 0;

        // Limite de Ramparts para o RCL atual
        const rcl = room.controller?.level || 1;
        const maxRamparts = 100; // Limit for now to avoid flooding
        let currentRamparts = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_RAMPART).length;
        let currentRampartCS = cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES, (cs) => cs.structureType === STRUCTURE_RAMPART).length;

        if (currentRamparts + currentRampartCS >= maxRamparts) {
            return 0; // Já atingimos o limite
        }

        // --- 1. RAMPARTS EM CIMA DE ESTRUTURAS CRÍTICAS ---
        // Colocamos ramparts DIRETAMENTE sobre estruturas vitais, não ao redor.
        const vitalStructures = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => 
            s.structureType === STRUCTURE_SPAWN || 
            s.structureType === STRUCTURE_TOWER ||
            s.structureType === STRUCTURE_STORAGE ||
            s.structureType === STRUCTURE_TERMINAL
        );

        for (const struct of vitalStructures) {
            if (currentRamparts + currentRampartCS + sitesCreated >= maxRamparts) break;

            const existingRampart = struct.pos.lookFor(LOOK_STRUCTURES).some((s: Structure) => s.structureType === STRUCTURE_RAMPART);
            const existingCS = struct.pos.lookFor(LOOK_CONSTRUCTION_SITES).some((cs: ConstructionSite) => cs.structureType === STRUCTURE_RAMPART);

            if (!existingRampart && !existingCS) {
                if (room.createConstructionSite(struct.pos, STRUCTURE_RAMPART) === OK) {
                    sitesCreated++;
                    currentRampartCS++;
                }
            }
        }

        // --- 2. DEFESA DE PERÍMETRO (BORDAS DA SALA) ---
        // Planeja bloqueios a 2 tiles das saídas para criar um muro defensivo
        if (sitesCreated < 10) { 
            const terrain = room.getTerrain();
            const exits = room.find(FIND_EXIT);
            const plannedPositions = new Set<string>();
            const wallPositions: RoomPosition[] = [];

            // 1. Identificar posições base (projeção das saídas)
            for (const exitPos of exits) {
                let bx = exitPos.x;
                let by = exitPos.y;

                if (bx === 0) bx = 2;
                else if (bx === 49) bx = 47;
                if (by === 0) by = 2;
                else if (by === 49) by = 47;

                const pos = new RoomPosition(bx, by, room.name);
                const key = `${pos.x},${pos.y}`;
                if (!plannedPositions.has(key) && terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL) {
                    plannedPositions.add(key);
                    wallPositions.push(pos);
                }
            }

            // 2. Preencher brechas diagonais (cantos)
            // Se tivermos W1 em (x,y) e W2 em (x+1, y+1), precisamos de bloqueios em (x+1, y) ou (x, y+1)
            const fillerPositions: RoomPosition[] = [];
            for (const pos of wallPositions) {
                const neighbors = [
                    {dx: 1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}
                ];
                for (const n of neighbors) {
                    const diagKey = `${pos.x + n.dx},${pos.y + n.dy}`;
                    if (plannedPositions.has(diagKey)) {
                        // Temos uma diagonal. Precisamos preencher os dois adjacentes para garantir 100% de bloqueio
                        const adj1 = new RoomPosition(pos.x + n.dx, pos.y, room.name);
                        const adj2 = new RoomPosition(pos.x, pos.y + n.dy, room.name);
                        
                        [adj1, adj2].forEach(adj => {
                            const adjKey = `${adj.x},${adj.y}`;
                            if (!plannedPositions.has(adjKey) && terrain.get(adj.x, adj.y) !== TERRAIN_MASK_WALL) {
                                fillerPositions.push(adj);
                                plannedPositions.add(adjKey);
                            }
                        });
                    }
                }
            }
            
            const allDefPositions = [...wallPositions, ...fillerPositions];

            for (const pos of allDefPositions) {
                const existingDef = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL);
                const existingCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(cs => cs.structureType === STRUCTURE_RAMPART || cs.structureType === STRUCTURE_WALL);

                if (!existingDef && !existingCS) {
                    const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
                    // Usar Rampart em "fillers" ou onde tem estrada para não travar
                    const isFiller = !wallPositions.includes(pos);
                    const type = (hasRoad || isFiller) ? STRUCTURE_RAMPART : STRUCTURE_WALL;

                    if (type === STRUCTURE_RAMPART && (currentRamparts + currentRampartCS + sitesCreated >= maxRamparts)) {
                        continue;
                    }

                    if (room.createConstructionSite(pos, type) === OK) {
                        sitesCreated++;
                        if (type === STRUCTURE_RAMPART) currentRampartCS++;
                        if (sitesCreated >= 15) break; // Limite por execução
                    }
                }
            }
        }

        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const towers = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_TOWER);
        if (towers.length === 0) return true;

        // Since there's no fixed limit for Ramparts/Walls in CONTROLLER_STRUCTURES,
        // we use a heuristic: if we have at least some defenses and no new sites were created recently, we move on.
        // For now, let's just say it's complete if we have at least 10 defenses or if we already planned some.
        const currentTotal = cacheUtils.findInRoom(room, FIND_MY_STRUCTURES, (s) => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL).length +
                             cacheUtils.findInRoom(room, FIND_CONSTRUCTION_SITES, (cs) => cs.structureType === STRUCTURE_RAMPART || cs.structureType === STRUCTURE_WALL).length;

        // If we have at least 1 defense per exit (roughly), we can proceed to other blueprints.
        // This avoids blocking the whole planner for defensive structures that can be expanded later.
        return currentTotal >= 20; 
    }
};

export default rampartsWallsBlueprint;
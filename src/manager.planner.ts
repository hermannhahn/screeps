// src/manager.planner.ts
import { addPlannedStructure, findClosestAnchor, isSourceSafe, isTerrainValidForRoad } from './tools';

export function planStructures(room: Room): void {
    if (!Memory.planning) {
        Memory.planning = { plannedStructures: [], spawnSquareRoadAnchorPositions: [], currentStage: 1 };
    }
    
    const planning = Memory.planning;
    if (planning.currentStage === undefined) planning.currentStage = 1;
    if (!planning.plannedStructures) planning.plannedStructures = [];
    if (!planning.spawnSquareRoadAnchorPositions) planning.spawnSquareRoadAnchorPositions = [];

    const stage = planning.currentStage;

    // --- ESTÁGIO 1: DIAMANTE DO SPAWN ---
    if (stage === 1) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const spawn = spawns[0];
            const offsets = [
                {dx: -2, dy: 0}, {dx: 2, dy: 0}, {dx: 0, dy: -2}, {dx: 0, dy: 2},
                {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}
            ];
            for (const off of offsets) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) {
                    planning.spawnSquareRoadAnchorPositions.push(pos);
                }
            }
        }
        
        const stage1Roads = planning.plannedStructures.filter((p: PlannedStructure) => 
            p.structureType === STRUCTURE_ROAD && 
            planning.spawnSquareRoadAnchorPositions.some((anchor: any) => anchor.x === p.pos.x && anchor.y === p.pos.y)
        );

        const allBuilt = stage1Roads.length > 0 && stage1Roads.every((p: PlannedStructure) => p.status === 'built');
        if (allBuilt) {
            console.log("Planner: Stage 1 Complete. Advancing to Stage 2.");
            planning.currentStage = 2;
        }
    }

    // --- ESTÁGIO 2: ESTRADAS DAS SOURCES E 5 EXTENSÕES ---
    if (stage === 2) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        // 1. Planejar Estradas para Sources Seguras
        const sources = room.find(FIND_SOURCES);
        const safeSources = sources.filter(s => isSourceSafe(s));
        const anchors = planning.spawnSquareRoadAnchorPositions;

        for (const source of safeSources) {
            const closestAnchor = findClosestAnchor(source.pos, anchors);
            if (closestAnchor) {
                const path = PathFinder.search(source.pos, { pos: closestAnchor, range: 1 }, {
                    plainCost: 2, swampCost: 10,
                    roomCallback: (roomName) => {
                        const costs = new PathFinder.CostMatrix();
                        planning.plannedStructures.forEach(p => {
                            if (p.structureType === STRUCTURE_ROAD) costs.set(p.pos.x, p.pos.y, 1);
                        });
                        return costs;
                    }
                }).path;

                for (const pos of path) {
                    addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room);
                }
            }
        }

        // 2. Planejar 5 Extensões (Sistema Robusto: Adjacente a estradas do Stage 1)
        const extensionsToBuild = 5;
        const builtExtensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
        const plannedExtensions = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length;
        
        if (builtExtensions + plannedExtensions < extensionsToBuild) {
            // Buscamos spots vazios em volta do diamante de estradas do spawn
            for (const roadPos of planning.spawnSquareRoadAnchorPositions) {
                if (planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;

                const adjacents = [
                    {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}
                ];

                for (const adj of adjacents) {
                    const pos = new RoomPosition(roadPos.x + adj.dx, roadPos.y + adj.dy, room.name);
                    
                    // Condições para uma boa extensão:
                    // - Não ser parede
                    // - Não ser onde o spawn está
                    // - Não estar ocupada por outra estrutura planejada (incluindo estradas)
                    if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && 
                        !pos.isEqualTo(spawn.pos) &&
                        !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                        
                        if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_EXTENSION, 'to_build', room)) {
                            if (planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                        }
                    }
                }
            }
        }

        // Verificar conclusão do estágio 2
        const stage2Roads = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_ROAD);
        const stage2Exts = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION);
        const allBuilt = stage2Roads.every(p => p.status === 'built') && 
                         stage2Exts.length >= 5 && stage2Exts.every(p => p.status === 'built');

        if (allBuilt) {
            console.log("Planner: Stage 2 Complete. Advancing to Stage 3.");
            planning.currentStage = 3;
        }
    }
}

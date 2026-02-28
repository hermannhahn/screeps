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
    const hasActiveCS = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0;

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
        if (allBuilt && !hasActiveCS) {
            console.log("Planner: Stage 1 Complete. Advancing to Stage 2.");
            planning.currentStage = 2;
        }
    }

    // --- ESTÁGIO 2: 5 EXTENSÕES ---
    if (stage === 2) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];

        const extensionsToBuild = 5;
        const builtExtensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
        const plannedExtensions = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION);
        
        if (builtExtensions + plannedExtensions.length < extensionsToBuild) {
            for (const roadPos of planning.spawnSquareRoadAnchorPositions) {
                if (planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                const adjacents = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
                for (const adj of adjacents) {
                    const pos = new RoomPosition(roadPos.x + adj.dx, roadPos.y + adj.dy, room.name);
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

        // LOG DE DEBUG PARA O ESTÁGIO 2
        const allBuilt = plannedExtensions.length > 0 && plannedExtensions.every(p => p.status === 'built');
        // console.log(`Planner Debug Stage 2: Exts=${plannedExtensions.length}, Built=${plannedExtensions.filter(p => p.status === 'built').length}, ActiveCS=${hasActiveCS}`);

        if (allBuilt && !hasActiveCS) {
            console.log("Planner: Stage 2 Complete. Advancing to Stage 3.");
            planning.currentStage = 3;
        }
    }

    // --- ESTÁGIO 3: ESTRADAS DAS SOURCES ---
    if (stage === 3) {
        const sources = room.find(FIND_SOURCES);
        const safeSources = sources.filter(s => isSourceSafe(s));
        const anchors = planning.spawnSquareRoadAnchorPositions;

        console.log(`Planner Stage 3: Planning roads for ${safeSources.length} safe sources.`);

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

        const stage3Roads = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_ROAD && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        const allBuilt = stage3Roads.length > 0 && stage3Roads.every(p => p.status === 'built');

        if (allBuilt && !hasActiveCS) {
            console.log("Planner: Stage 3 Complete. Advancing to Stage 4.");
            planning.currentStage = 4;
        }
    }

    // --- ESTÁGIO 4: ESTRADAS DO CONTROLLER ---
    if (stage === 4) {
        const controller = room.controller;
        if (!controller) return;
        const anchors = planning.spawnSquareRoadAnchorPositions;
        const closestAnchor = findClosestAnchor(controller.pos, anchors);

        if (closestAnchor) {
            const path = PathFinder.search(controller.pos, { pos: closestAnchor, range: 1 }, {
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

        const stage4Roads = planning.plannedStructures.filter(p => p.status === 'to_build' || p.status === 'building');
        if (stage4Roads.length === 0 && !hasActiveCS) {
            console.log("Planner: Stage 4 Complete. All initial work finished.");
            planning.currentStage = 5;
        }
    }
}

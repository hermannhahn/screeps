// src/manager.planner.ts
import { addPlannedStructure, findClosestAnchor, isSourceSafe } from './tools';

export function planStructures(room: Room): void {
    if (!Memory.planning) {
        Memory.planning = { plannedStructures: [], spawnSquareRoadAnchorPositions: [], currentStage: 1 };
    }
    
    const planning = Memory.planning;
    if (planning.currentStage === undefined) planning.currentStage = 1;
    if (!planning.plannedStructures) planning.plannedStructures = [];
    if (!planning.spawnSquareRoadAnchorPositions) planning.spawnSquareRoadAnchorPositions = [];

    const stage = planning.currentStage;
    const activeCS = room.find(FIND_MY_CONSTRUCTION_SITES);

    // --- LIMPEZA DE SEGURANÇA ---
    const sources = room.find(FIND_SOURCES);
    const unsafeSources = sources.filter(s => !isSourceSafe(s));
    
    if (unsafeSources.length > 0) {
        planning.plannedStructures = planning.plannedStructures.filter(p => {
            const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
            return !unsafeSources.some(us => pPos.inRangeTo(us, 10));
        });
        for (const cs of activeCS) {
            if (unsafeSources.some(us => cs.pos.inRangeTo(us, 10))) {
                cs.remove();
            }
        }
    }

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
        if (allBuilt && activeCS.length === 0) {
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
            for (const roadPosRaw of planning.spawnSquareRoadAnchorPositions) {
                const roadPos = new RoomPosition(roadPosRaw.x, roadPosRaw.y, roadPosRaw.roomName);
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

        const stage2Exts = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION);
        const allBuilt = stage2Exts.length >= 5 && stage2Exts.every(p => p.status === 'built');

        if (allBuilt && activeCS.length === 0) {
            console.log("Planner: Stage 2 Complete. Advancing to Stage 3.");
            planning.currentStage = 3;
        }
    }

    // --- ESTÁGIO 3: ESTRADAS DAS SOURCES ---
    if (stage === 3) {
        const safeSources = sources.filter(s => isSourceSafe(s));
        const anchorsRaw = planning.spawnSquareRoadAnchorPositions;
        const anchors = anchorsRaw.map(a => new RoomPosition(a.x, a.y, a.roomName));

        if (anchors.length > 0) {
            let addedAny = false;
            for (const source of safeSources) {
                const alreadyPlanned = planning.plannedStructures.some(p => {
                    const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
                    return p.structureType === STRUCTURE_ROAD && pPos.isNearTo(source.pos);
                });
                
                if (!alreadyPlanned) {
                    const closestAnchor = findClosestAnchor(source.pos, anchors);
                    if (closestAnchor) {
                        const path = PathFinder.search(source.pos, { pos: closestAnchor, range: 1 }, {
                            plainCost: 2, swampCost: 10,
                            roomCallback: (r) => {
                                let costs = new PathFinder.CostMatrix();
                                room.find(FIND_STRUCTURES).forEach(s => {
                                    if (s.structureType !== STRUCTURE_ROAD) costs.set(s.pos.x, s.pos.y, 0xff);
                                });
                                return costs;
                            }
                        }).path;

                        for (const pos of path) {
                            if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) {
                                addedAny = true;
                            }
                        }
                    }
                }
            }
            if (addedAny) console.log("Planner Stage 3: New road positions added.");
        }

        const stage3Roads = planning.plannedStructures.filter(p => 
            p.structureType === STRUCTURE_ROAD && 
            !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y)
        );
        
        const allBuilt = stage3Roads.length > 0 && stage3Roads.every(p => p.status === 'built');
        if (allBuilt && activeCS.length === 0) {
            console.log("Planner: Stage 3 Complete. Advancing to Stage 4.");
            planning.currentStage = 4;
        }
    }

    // --- ESTÁGIO 4: CONTAINERS (Sources, Controller, Torres) ---
    if (stage === 4) {
        let addedAny = false;

        // 1. Containers nas Sources Seguras
        const safeSources = sources.filter(s => isSourceSafe(s));
        for (const source of safeSources) {
            const hasContainer = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(source, 2) }).length > 0 ||
                                 planning.plannedStructures.some(p => p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(source, 2));
            
            if (!hasContainer) {
                // Tenta colocar a 1 bloco de distância
                const spots = source.pos.findInRange(FIND_PATH, 1); // Simples busca de vizinhos
                // Alternativa: usar a estrada que já chega perto da source
                const roadNearSource = planning.plannedStructures.find(p => p.structureType === STRUCTURE_ROAD && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).isNearTo(source.pos));
                const targetPos = roadNearSource ? new RoomPosition(roadNearSource.pos.x, roadNearSource.pos.y, roadNearSource.pos.roomName) : null;

                if (targetPos && addPlannedStructure(planning.plannedStructures, targetPos, STRUCTURE_CONTAINER, 'to_build', room)) {
                    addedAny = true;
                }
            }
        }

        // 2. Container no Controller
        if (room.controller) {
            const hasCont = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(room.controller!, 3) }).length > 0 ||
                            planning.plannedStructures.some(p => p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(room.controller!, 3));
            
            if (!hasCont) {
                const pos = new RoomPosition(room.controller.pos.x + 1, room.controller.pos.y + 1, room.name); // Spot simples
                if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room)) addedAny = true;
            }
        }

        // 3. Container nas Torres
        const towers = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
        for (const tower of towers) {
            const hasCont = tower.pos.findInRange(FIND_STRUCTURES, 1, { filter: { structureType: STRUCTURE_CONTAINER } }).length > 0 ||
                            planning.plannedStructures.some(p => p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).isNearTo(tower.pos));
            if (!hasCont) {
                const pos = new RoomPosition(tower.pos.x, tower.pos.y + 1, room.name);
                if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room)) addedAny = true;
            }
        }

        const stage4Conts = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_CONTAINER);
        const allBuilt = stage4Conts.length > 0 && stage4Conts.every(p => p.status === 'built');

        if (allBuilt && activeCS.length === 0) {
            console.log("Planner: Stage 4 Complete. Advancing to Stage 5.");
            planning.currentStage = 5;
        }
    }

    // --- ESTÁGIO 5: ESTRADAS DO CONTROLLER ---
    if (stage === 5) {
        const controller = room.controller;
        if (!controller) return;
        const anchorsRaw = planning.spawnSquareRoadAnchorPositions;
        const anchors = anchorsRaw.map(a => new RoomPosition(a.x, a.y, a.roomName));
        const closestAnchor = findClosestAnchor(controller.pos, anchors);

        if (closestAnchor) {
            const path = PathFinder.search(controller.pos, { pos: closestAnchor, range: 1 }, {
                plainCost: 2, swampCost: 10
            }).path;

            for (const pos of path) {
                addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room);
            }
        }

        const stage5Roads = planning.plannedStructures.filter(p => p.status !== 'built' && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        if (stage5Roads.length === 0 && activeCS.length === 0) {
            console.log("Planner: Stage 5 Complete.");
            planning.currentStage = 6;
        }
    }
}

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
            if (unsafeSources.some(us => cs.pos.inRangeTo(us, 10))) cs.remove();
        }
    }

    // --- ESTÁGIOS 1-6 (Mantidos como estão) ---
    // Estágio 1: Diamante Spawn
    // Estágio 2: 5 Extensões
    // Estágio 3: Estradas Sources Locais
    // Estágio 4: Containers Locais
    // Estágio 5: Estradas Controller Local
    // Estágio 6: Torre Local

    // (Lógica dos Estágios 1 a 6 aqui... vou focar no avanço para o 7)
    // --- ESTÁGIO 1 ---
    if (stage === 1) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const spawn = spawns[0];
            const offsets = [{dx:-2,dy:0},{dx:2,dy:0},{dx:0,dy:-2},{dx:0,dy:2},{dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}];
            for (const off of offsets) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) {
                    planning.spawnSquareRoadAnchorPositions.push(pos);
                }
            }
        }
        const stage1Roads = planning.plannedStructures.filter((p: any) => p.structureType === STRUCTURE_ROAD && planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        if (stage1Roads.length > 0 && stage1Roads.every((p: any) => p.status === 'built') && activeCS.length === 0) planning.currentStage = 2;
    }

    // --- ESTÁGIO 2 ---
    if (stage === 2) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];
        const extensionsToBuild = 5;
        const currentExtCount = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length + room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
        if (currentExtCount < extensionsToBuild) {
            for (const roadPosRaw of planning.spawnSquareRoadAnchorPositions) {
                if (planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                const adjacents = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
                for (const adj of adjacents) {
                    const pos = new RoomPosition(roadPosRaw.x + adj.dx, roadPosRaw.y + adj.dy, roadPosRaw.roomName);
                    if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !pos.isEqualTo(spawn.pos) && !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                        if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_EXTENSION, 'to_build', room)) {
                            if (planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                        }
                    }
                }
            }
        }
        const stage2Exts = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_EXTENSION);
        if (stage2Exts.length >= 5 && stage2Exts.every(p => p.status === 'built') && activeCS.length === 0) planning.currentStage = 3;
    }

    // --- ESTÁGIO 3 ---
    if (stage === 3) {
        const safeSources = room.find(FIND_SOURCES).filter(s => isSourceSafe(s));
        const anchors = planning.spawnSquareRoadAnchorPositions.map(a => new RoomPosition(a.x, a.y, a.roomName));
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
                            room.find(FIND_STRUCTURES).forEach(s => { if (s.structureType !== STRUCTURE_ROAD) costs.set(s.pos.x, s.pos.y, 0xff); });
                            return costs;
                        }
                    }).path;
                    for (const pos of path) addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room);
                }
            }
        }
        const stage3Roads = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_ROAD && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        if (stage3Roads.length > 0 && stage3Roads.every(p => p.status === 'built') && activeCS.length === 0) planning.currentStage = 4;
    }

    // --- ESTÁGIO 4 ---
    if (stage === 4) {
        const safeSources = room.find(FIND_SOURCES).filter(s => isSourceSafe(s));
        for (const source of safeSources) {
            const hasContainer = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(source, 2) }).length > 0 ||
                                 planning.plannedStructures.some(p => p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(source, 2));
            if (!hasContainer) {
                const roadNearSource = planning.plannedStructures.find(p => p.structureType === STRUCTURE_ROAD && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).isNearTo(source.pos));
                if (roadNearSource) {
                    const pos = new RoomPosition(roadNearSource.pos.x, roadNearSource.pos.y, roadNearSource.pos.roomName);
                    addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room);
                }
            }
        }
        if (room.controller) {
            const hasCont = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(room.controller!, 3) }).length > 0 ||
                            planning.plannedStructures.some(p => p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(room.controller!, 3));
            if (!hasCont) {
                const pos = new RoomPosition(room.controller.pos.x + 1, room.controller.pos.y + 1, room.name);
                addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room);
            }
        }
        const stage4Conts = planning.plannedStructures.filter(p => p.structureType === STRUCTURE_CONTAINER);
        if (stage4Conts.length > 0 && stage4Conts.every(p => p.status === 'built') && activeCS.length === 0) planning.currentStage = 5;
    }

    // --- ESTÁGIO 5 ---
    if (stage === 5) {
        if (room.controller) {
            const anchors = planning.spawnSquareRoadAnchorPositions.map(a => new RoomPosition(a.x, a.y, a.roomName));
            const closestAnchor = findClosestAnchor(room.controller.pos, anchors);
            if (closestAnchor) {
                const path = PathFinder.search(room.controller.pos, { pos: closestAnchor, range: 1 }, { plainCost: 2, swampCost: 10 }).path;
                for (const pos of path) addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room);
            }
        }
        const stage5Roads = planning.plannedStructures.filter(p => p.status !== 'built' && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y) && p.structureType === STRUCTURE_ROAD);
        if (stage5Roads.length === 0 && activeCS.length === 0) planning.currentStage = 6;
    }

    // --- ESTÁGIO 6 ---
    if (stage === 6) {
        if (!room.controller || room.controller.level < 3) return;
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return;
        const spawn = spawns[0];
        const hasTower = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).length > 0 || planning.plannedStructures.some(p => p.structureType === STRUCTURE_TOWER);
        if (!hasTower) {
            const towerSpots = [{dx: 0, dy: -3}, {dx: 0, dy: 3}, {dx: -3, dy: 0}, {dx: 3, dy: 0}];
            for (const off of towerSpots) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                    if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_TOWER, 'to_build', room)) break;
                }
            }
        }
        const plannedTower = planning.plannedStructures.find(p => p.structureType === STRUCTURE_TOWER);
        if (plannedTower && plannedTower.status === 'built' && activeCS.length === 0) {
            console.log("Planner: Stage 6 Complete. Advancing to Stage 7.");
            planning.currentStage = 7;
        }
    }

    // --- ESTÁGIO 7: ESTRADAS REMOTAS ---
    if (stage === 7) {
        if (!Memory.remoteMining) return;
        const anchors = planning.spawnSquareRoadAnchorPositions.map(a => new RoomPosition(a.x, a.y, a.roomName));
        
        let addedAny = false;
        for (const remoteRoomName in Memory.remoteMining) {
            const data = Memory.remoteMining[remoteRoomName];
            if (data.isHostile) continue;

            for (const sourceId of data.sources) {
                const sourcePos = Game.getObjectById(sourceId)?.pos;
                if (!sourcePos) continue;

                const alreadyPlanned = planning.plannedStructures.some(p => {
                    const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
                    return p.structureType === STRUCTURE_ROAD && pPos.isNearTo(sourcePos);
                });

                if (!alreadyPlanned) {
                    const closestAnchor = findClosestAnchor(sourcePos, anchors);
                    if (closestAnchor) {
                        const path = PathFinder.search(sourcePos, { pos: closestAnchor, range: 1 }, {
                            plainCost: 2, swampCost: 10,
                            roomCallback: (r) => {
                                const costs = new PathFinder.CostMatrix();
                                // Preferimos estradas existentes ou planejadas
                                planning.plannedStructures.forEach(p => { if (p.structureType === STRUCTURE_ROAD) costs.set(p.pos.x, p.pos.y, 1); });
                                return costs;
                            }
                        }).path;

                        for (const pos of path) {
                            if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) addedAny = true;
                        }
                    }
                }
            }
        }
        if (addedAny) console.log("Planner Stage 7: Planned remote source roads.");
    }
}

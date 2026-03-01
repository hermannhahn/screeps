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
    const localActiveCS = room.find(FIND_MY_CONSTRUCTION_SITES);

    // --- LIMPEZA DE SEGURANÇA E ISOLAMENTO ---
    const sources = room.find(FIND_SOURCES);
    const unsafeSources = sources.filter(s => !isSourceSafe(s));
    
    planning.plannedStructures = planning.plannedStructures.filter(p => {
        const isMainRoom = (p.pos.roomName === room.name);
        if (!isMainRoom && stage < 7) return false; // Impede planejamento remoto antes do Estágio 7
        const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
        if (unsafeSources.some(us => pPos.inRangeTo(us, 10))) return false;
        return true;
    });

    // --- ESTÁGIO 1: DIAMANTE DO SPAWN ---
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
        const stage1Roads = planning.plannedStructures.filter((p: any) => p.pos.roomName === room.name && p.structureType === STRUCTURE_ROAD && planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        if (stage1Roads.length > 0 && stage1Roads.every((p: any) => p.status === 'built') && localActiveCS.length === 0) planning.currentStage = 2;
    }

    // --- ESTÁGIO 2: 5 EXTENSÕES ---
    if (stage === 2) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;
        const extensionsToBuild = 5;
        const currentExtCount = planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_EXTENSION).length + room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
        if (currentExtCount < extensionsToBuild) {
            for (const roadPosRaw of planning.spawnSquareRoadAnchorPositions) {
                if (planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                const adjacents = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
                for (const adj of adjacents) {
                    const pos = new RoomPosition(roadPosRaw.x + adj.dx, roadPosRaw.y + adj.dy, roadPosRaw.roomName);
                    if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !pos.isEqualTo(spawn.pos) && !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                        if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_EXTENSION, 'to_build', room)) {
                            if (planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_EXTENSION).length >= extensionsToBuild) break;
                        }
                    }
                }
            }
        }
        const stage2Exts = planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_EXTENSION);
        if (stage2Exts.length >= 5 && stage2Exts.every(p => p.status === 'built') && localActiveCS.length === 0) planning.currentStage = 3;
    }

    // --- ESTÁGIO 3: ESTRADAS SOURCES LOCAIS ---
    if (stage === 3) {
        const safeSources = room.find(FIND_SOURCES).filter(s => isSourceSafe(s));
        const anchors = planning.spawnSquareRoadAnchorPositions.map(a => new RoomPosition(a.x, a.y, a.roomName));
        for (const source of safeSources) {
            const alreadyPlanned = planning.plannedStructures.some(p => {
                const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
                return p.pos.roomName === room.name && p.structureType === STRUCTURE_ROAD && pPos.isNearTo(source.pos);
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
        const stage3Roads = planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_ROAD && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y));
        if (stage3Roads.length > 0 && stage3Roads.every(p => p.status === 'built') && localActiveCS.length === 0) planning.currentStage = 4;
    }

    // --- ESTÁGIO 4: ESTRADAS CONTROLLER LOCAL ---
    if (stage === 4) {
        if (room.controller) {
            const anchors = planning.spawnSquareRoadAnchorPositions.map(a => new RoomPosition(a.x, a.y, a.roomName));
            const closestAnchor = findClosestAnchor(room.controller.pos, anchors);
            if (closestAnchor) {
                const path = PathFinder.search(room.controller.pos, { pos: closestAnchor, range: 1 }, { plainCost: 2, swampCost: 10 }).path;
                for (const pos of path) addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room);
            }
        }
        const stage4Roads = planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.status !== 'built' && !planning.spawnSquareRoadAnchorPositions.some((a: any) => a.x === p.pos.x && a.y === p.pos.y) && p.structureType === STRUCTURE_ROAD);
        if (stage4Roads.length === 0 && localActiveCS.length === 0) planning.currentStage = 6; // Pula 5 para o 6 (Containers)
    }

    // --- ESTÁGIO 6: CONTAINERS LOCAIS ---
    if (stage === 6) {
        const safeSources = room.find(FIND_SOURCES).filter(s => isSourceSafe(s));
        for (const source of safeSources) {
            const hasContainer = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(source, 2) }).length > 0 ||
                                 planning.plannedStructures.some(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(source, 2));
            if (!hasContainer) {
                const roadNearSource = planning.plannedStructures.find(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_ROAD && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).isNearTo(source.pos));
                if (roadNearSource) {
                    const pos = new RoomPosition(roadNearSource.pos.x, roadNearSource.pos.y, roadNearSource.pos.roomName);
                    addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room);
                }
            }
        }
        if (room.controller) {
            const hasCont = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER && s.pos.inRangeTo(room.controller!, 3) }).length > 0 ||
                            planning.plannedStructures.some(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_CONTAINER && new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName).inRangeTo(room.controller!, 3));
            if (!hasCont) {
                const spots = [{dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: -1}];
                for (const off of spots) {
                    const pos = new RoomPosition(room.controller.pos.x + off.dx, room.controller.pos.y + off.dy, room.name);
                    if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                        if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_CONTAINER, 'to_build', room)) break;
                    }
                }
            }
        }
        const stage6Conts = planning.plannedStructures.filter(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_CONTAINER);
        if (stage6Conts.length > 0 && stage6Conts.every(p => p.status === 'built') && localActiveCS.length === 0) {
            console.log("Planner: Stage 6 (Containers) Complete. Advancing to Stage 7 (Remote Roads).");
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
            const remoteRoom = Game.rooms[remoteRoomName];
            if (!remoteRoom) continue; // Precisa de visibilidade

            for (const sourceId of data.sources) {
                const source = Game.getObjectById(sourceId);
                if (!source) continue;
                const alreadyPlanned = planning.plannedStructures.some(p => {
                    const pPos = new RoomPosition(p.pos.x, p.pos.y, p.pos.roomName);
                    return p.pos.roomName === remoteRoomName && p.structureType === STRUCTURE_ROAD && pPos.isNearTo(source.pos);
                });
                if (!alreadyPlanned) {
                    const closestAnchor = findClosestAnchor(source.pos, anchors);
                    if (closestAnchor) {
                        const path = PathFinder.search(source.pos, { pos: closestAnchor, range: 1 }, {
                            plainCost: 2, swampCost: 10,
                            roomCallback: (r) => {
                                const costs = new PathFinder.CostMatrix();
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
        
        const remoteRoads = planning.plannedStructures.filter(p => p.pos.roomName !== room.name && p.structureType === STRUCTURE_ROAD);
        if (remoteRoads.length > 0 && remoteRoads.every(p => p.status === 'built') && localActiveCS.length === 0) {
            console.log("Planner: Stage 7 Complete. Advancing to Stage 8 (Tower).");
            planning.currentStage = 8;
        }
    }

    // --- ESTÁGIO 8: PRIMEIRA TORRE (RCL 3) ---
    if (stage === 8) {
        if (!room.controller || room.controller.level < 3) return;
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;
        const hasTower = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).length > 0 || planning.plannedStructures.some(p => p.pos.roomName === room.name && p.structureType === STRUCTURE_TOWER);
        if (!hasTower) {
            const towerSpots = [{dx: 0, dy: -3}, {dx: 0, dy: 3}, {dx: -3, dy: 0}, {dx: 3, dy: 0}];
            for (const off of towerSpots) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (room.getTerrain().get(pos.x, pos.y) !== TERRAIN_MASK_WALL && !planning.plannedStructures.some(p => p.pos.x === pos.x && p.pos.y === pos.y)) {
                    if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_TOWER, 'to_build', room)) break;
                }
            }
        }
    }
}

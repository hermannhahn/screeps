// src/manager.planner.ts
import { addPlannedStructure } from './tools';

export function planStructures(room: Room): void {
    // Inicialização robusta da memória
    if (!Memory.planning) {
        Memory.planning = { plannedStructures: [], spawnSquareRoadAnchorPositions: [], currentStage: 1 };
    }
    if (Memory.planning.currentStage === undefined) {
        Memory.planning.currentStage = 1;
    }
    if (!Memory.planning.plannedStructures) {
        Memory.planning.plannedStructures = [];
    }
    if (!Memory.planning.spawnSquareRoadAnchorPositions) {
        Memory.planning.spawnSquareRoadAnchorPositions = [];
    }

    const stage = Memory.planning.currentStage;
    console.log(`Planner Stage: ${stage}`);

    if (stage === 1) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const spawn = spawns[0];
            const offsets = [{dx:-2, dy:0}, {dx:2, dy:0}, {dx:0, dy:-2}, {dx:0, dy:2}];
            let added = 0;
            
            for (const off of offsets) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (addPlannedStructure(Memory.planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) {
                    Memory.planning.spawnSquareRoadAnchorPositions.push(pos);
                    added++;
                }
            }
            if (added > 0) console.log(`Planner: Stage 1 - Planned ${added} roads.`);
        }
        
        // Verifica se ainda há algo para construir no estágio 1
        const pending = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build').length;
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }).length;

        if (pending === 0 && constructionSites === 0 && Memory.planning.spawnSquareRoadAnchorPositions.length > 0) {
            console.log("Planner: Stage 1 Complete. Advancing to Stage 2.");
            Memory.planning.currentStage = 2;
        }
    }
}

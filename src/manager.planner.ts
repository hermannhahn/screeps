// src/manager.planner.ts
import { addPlannedStructure } from './tools';

export function planStructures(room: Room): void {
    // Inicialização robusta da memória
    if (!Memory.planning) {
        Memory.planning = { plannedStructures: [], spawnSquareRoadAnchorPositions: [], currentStage: 1 };
    }
    
    const planning = Memory.planning; // Variável local para evitar erro de 'possibly undefined'

    if (planning.currentStage === undefined) planning.currentStage = 1;
    if (!planning.plannedStructures) planning.plannedStructures = [];
    if (!planning.spawnSquareRoadAnchorPositions) planning.spawnSquareRoadAnchorPositions = [];

    const stage = planning.currentStage;
    console.log(`Planner Stage: ${stage}`);

    if (stage === 1) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const spawn = spawns[0];
            // 8 pontos para formar um losango a 2 blocos de distância
            const offsets = [
                {dx: -2, dy: 0}, {dx: 2, dy: 0}, {dx: 0, dy: -2}, {dx: 0, dy: 2},
                {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}
            ];
            let added = 0;
            
            for (const off of offsets) {
                const pos = new RoomPosition(spawn.pos.x + off.dx, spawn.pos.y + off.dy, room.name);
                if (addPlannedStructure(planning.plannedStructures, pos, STRUCTURE_ROAD, 'to_build', room)) {
                    planning.spawnSquareRoadAnchorPositions.push(pos);
                    added++;
                }
            }
            if (added > 0) console.log(`Planner: Stage 1 - Planned ${added} more roads for the diamond.`);
        }
        
        // Verifica se todas as estradas planejadas no estágio 1 estão construídas
        const stage1Roads = planning.plannedStructures.filter((p: PlannedStructure) => 
            p.structureType === STRUCTURE_ROAD && 
            planning.spawnSquareRoadAnchorPositions.some((anchor: any) => anchor.x === p.pos.x && anchor.y === p.pos.y)
        );

        const allBuilt = stage1Roads.length > 0 && stage1Roads.every((p: PlannedStructure) => p.status === 'built');

        if (allBuilt) {
            console.log("Planner: Stage 1 (Diamond) Complete. Advancing to Stage 2.");
            planning.currentStage = 2;
        }
    }
}

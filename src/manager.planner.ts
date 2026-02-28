// src/manager.planner.ts
import { addPlannedStructure } from './tools';

export function planStructures(room: Room): void {
    if (!Memory.planning) {
        Memory.planning = { plannedStructures: [], spawnSquareRoadAnchorPositions: [], currentStage: 1 };
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
        
        const pending = Memory.planning.plannedStructures.filter((p: PlannedStructure) => p.status === 'to_build').length;
        if (pending === 0 && Memory.planning.spawnSquareRoadAnchorPositions.length > 0) {
            console.log("Planner: Stage 1 Complete. Advancing to Stage 2.");
            Memory.planning.currentStage = 2;
        }
    }
}

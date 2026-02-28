import { isSafePosition } from './utils'; 

/**
 * Gera as posições planejadas para Extensões para um dado RCL.
 * Foca no layout ideal, assumindo sala limpa.
 */
export function generateExtensionsLayout(room: Room, spawn: StructureSpawn, rcl: number): PlannedStructure[] {
    const planned: PlannedStructure[] = [];
    if (rcl < 2) return planned;

    const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][rcl];
    let count = 0;

    // Padrão de posições relativas (em anéis ao redor do spawn)
    const relativePositions = [
        { dx: -2, dy: -2 }, { dx: -2, dy: 0 }, { dx: -2, dy: 2 },
        { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
        { dx: 2, dy: -2 }, { dx: 2, dy: 0 }, { dx: 2, dy: 2 },
        { dx: -3, dy: -3 }, { dx: -3, dy: -1 }, { dx: -3, dy: 1 }, { dx: -3, dy: 3 },
        { dx: -1, dy: -3 }, { dx: -1, dy: 3 },
        { dx: 1, dy: -3 }, { dx: 1, dy: 3 },
        { dx: 3, dy: -3 }, { dx: 3, dy: -1 }, { dx: 3, dy: 1 }, { dx: 3, dy: 3 },
        // Adicionando mais posições para RCLs maiores
        { dx: -4, dy: -4 }, { dx: -4, dy: -2 }, { dx: -4, dy: 0 }, { dx: -4, dy: 2 }, { dx: -4, dy: 4 },
        { dx: -2, dy: -4 }, { dx: -2, dy: 4 },
        { dx: 0, dy: -4 }, { dx: 0, dy: 4 },
        { dx: 2, dy: -4 }, { dx: 2, dy: 4 },
        { dx: 4, dy: -4 }, { dx: 4, dy: -2 }, { dx: 4, dy: 0 }, { dx: 4, dy: 2 }, { dx: 4, dy: 4 },
        { dx: -5, dy: -5 }, { dx: -5, dy: -3 }, { dx: -5, dy: -1 }, { dx: -5, dy: 1 }, { dx: -5, dy: 3 }, { dx: -5, dy: 5 },
        { dx: -3, dy: -5 }, { dx: -3, dy: 5 },
        { dx: -1, dy: -5 }, { dx: -1, dy: 5 },
        { dx: 1, dy: -5 }, { dx: 1, dy: 5 },
        { dx: 3, dy: -5 }, { dx: 3, dy: 5 },
        { dx: 5, dy: -5 }, { dx: 5, dy: -3 }, { dx: 5, dy: -1 }, { dx: 5, dy: 1 }, { dx: 5, dy: 3 }, { dx: 5, dy: 5 }
    ];

    for (const rel of relativePositions) {
        if (count >= maxExtensionsForRCL) break;

        const x = spawn.pos.x + rel.dx;
        const y = spawn.pos.y + rel.dy;

        if (x < 1 || x > 48 || y < 1 || y > 48) continue;
        if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

        planned.push({ x: x, y: y, structureType: STRUCTURE_EXTENSION });
        count++;
    }

    return planned;
}

export default generateExtensionsLayout;
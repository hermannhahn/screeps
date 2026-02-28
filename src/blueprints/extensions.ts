import { PlannedStructure } from '../declarations'; // Importar PlannedStructure
import { isSafePosition } from './utils';

/**
 * Gera as posições planejadas para Extensões para um dado RCL,
 * usando um padrão fixo ao redor do spawn.
 * @param room A sala atual.
 * @param spawn O spawn principal da sala.
 * @param rcl O nível atual do Controller da sala.
 * @returns Um array de PlannedStructure para as extensões.
 */
export function generateExtensionsLayout(room: Room, spawn: StructureSpawn, rcl: number): PlannedStructure[] {
    const planned: PlannedStructure[] = [];
    if (rcl < 2) return planned; // Extensões só são permitidas a partir do RCL 2

    const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][rcl];
    let currentExtensions = 0;

    // Posições relativas ao spawn para um padrão de extensão (ex: em espiral ou anel)
    // Este é um exemplo, pode ser ajustado para um layout específico
    const relativePositions = [
        { dx: 0, dy: -2 }, { dx: 1, dy: -2 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 },
        { dx: 1, dy: 2 }, { dx: 0, dy: 2 }, { dx: -1, dy: 2 }, { dx: -2, dy: -1 }, { dx: -2, dy: 0 },
        { dx: -2, dy: -1 }, { dx: -1, dy: -2 }, // Primeiro anel (4 extensões para RCL2)
        { dx: 0, dy: -3 }, { dx: 1, dy: -3 }, { dx: 2, dy: -2 }, { dx: 3, dy: -1 }, { dx: 3, dy: 0 },
        { dx: 3, dy: 1 }, { dx: 2, dy: 2 }, { dx: 1, dy: 3 }, { dx: 0, dy: 3 }, { dx: -1, dy: 3 },
        { dx: -2, dy: 2 }, { dx: -3, dy: 1 }, { dx: -3, dy: 0 }, { dx: -3, dy: -1 }, { dx: -2, dy: -2 },
        { dx: -1, dy: -3 }, // Segundo anel (8 extensões para RCL3)
        // Adicione mais posições conforme necessário para RCLs mais altos.
        // RCL4 (10 ext) = 5+5 extras
        // RCL5 (10 ext) = 5+5+5 extras
        // etc.
        { dx: -3, dy: -2 }, { dx: -3, dy: 2 }, { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: -2, dy: -3 },
        { dx: 2, dy: -3 }, { dx: -2, dy: 3 }, { dx: 2, dy: 3 }, // Anel externo para RCL4+
    ];

    for (const relPos of relativePositions) {
        if (currentExtensions >= maxExtensionsForRCL) break;

        const x = spawn.pos.x + relPos.dx;
        const y = spawn.pos.y + relPos.dy;

        // Verificar limites da sala
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;

        const pos = new RoomPosition(x, y, room.name);

        // Verificar se a posição é segura (não é wall e está longe do spawn)
        if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;
        // Evita construir muito perto do spawn ou em posições importantes (como o próprio spawn)
        if (pos.getRangeTo(spawn.pos) <= 1) continue; 
        
        // No novo planner, a verificação de "isSafePosition" e "não ter outra estrutura" será feita pelo manager.planner.ts
        // Aqui, apenas geramos as posições "ideais".

        planned.push({ x: x, y: y, structureType: STRUCTURE_EXTENSION });
        currentExtensions++;
    }

    return planned;
}

export default generateExtensionsLayout;
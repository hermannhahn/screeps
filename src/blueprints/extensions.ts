import { isSafePosition } from './utils'; 
// PlannedStructure is now global via declarations.d.ts

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
    let currentExtensionsCount = 0;

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
        if (currentExtensionsCount >= maxExtensionsForRCL) break;

        const x = spawn.pos.x + relPos.dx;
        const y = spawn.pos.y + relPos.dy;

        // Verificar limites da sala
        if (x < 1 || x > 48 || y < 1 || y > 48) continue;

        const pos = new RoomPosition(x, y, room.name);

        // 1. Verificar terreno (wall)
        if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

        // 2. Evitar construir muito perto do spawn (ou em cima dele)
        if (pos.getRangeTo(spawn.pos) <= 1) continue; 
        
        // 3. Verificar estruturas existentes e canteiros de obra que BLOQUEIAM uma EXTENSION
        const look = pos.look();
        const hasBlockingElement = look.some(obj => {
            if (obj.type === LOOK_STRUCTURES) {
                // Extensões NÃO podem ser construídas sobre:
                // SPWANS, CONTROLLERS, SOURCES, MINERALS, TOWERS, STORAGE, LINKS, EXTRACTORS, LABS, TERMINALS, NUKERS, FACTORIES, OBSERVERS, POWER_SPAWNS
                // E, CRITICAMENTE, RAMPARTS são bloqueadores para EXTENSIONS.
                // APENAS ROADS e CONTAINERS não bloqueiam a construção de EXTENSIONS.
                return obj.structure && (
                    obj.structure.structureType !== STRUCTURE_ROAD &&
                    obj.structure.structureType !== STRUCTURE_CONTAINER
                    // Qualquer outra estrutura aqui bloqueia, incluindo RAMPARTS.
                );
            }
            if (obj.type === LOOK_CONSTRUCTION_SITES) {
                // Se já existe um CS de qualquer coisa, ele bloqueia a criação de um NOVO CS de extensão.
                return true;
            }
            // Check para fontes, minerais (recursos não construíveis, não estruturas)
            // O controller é uma estrutura e será pego pelo obj.type === LOOK_STRUCTURES
            if (obj.type === LOOK_SOURCES || obj.type === LOOK_MINERALS) {
                return true;
            }
            return false;
        });

        if (hasBlockingElement) {
            // console.log(`[generateExtensionsLayout] Skipping ${x},${y} due to blocking element.`);
            continue; // Pular esta posição se houver algo bloqueando
        }

        planned.push({ x: x, y: y, structureType: STRUCTURE_EXTENSION });
        currentExtensionsCount++;
    }

    return planned;
}

export default generateExtensionsLayout;
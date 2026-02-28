import { isSafePosition } from './blueprints/utils';

const layoutGenerator = {
    generateLayout: function(room: Room, spawn: StructureSpawn): void {
        const roomLayout: RoomLayoutMemory = {
            rcl: {},
            generated: true
        };

        const currentRCL = room.controller ? room.controller.level : 0; // Capture o RCL atual da sala

        // --- Handle current RCL ---
        // Primeiro, garantimos que o array para o RCL atual exista
        if (!roomLayout.rcl[currentRCL]) {
            roomLayout.rcl[currentRCL] = [];
        }

        // 1. Capturar estruturas existentes que queremos manter (ex: estradas, extensões próximas ao spawn)
        // Para o RCL 1, vamos focar nas estradas ao redor do spawn e extensões básicas.
        const structuresToCapture = room.find(FIND_STRUCTURES, {
            filter: (s: Structure) => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_EXTENSION)
                        && s.pos.getRangeTo(spawn.pos) <= 3 // Exemplo: dentro de um raio de 3 do spawn
        });

        for (const s of structuresToCapture) {
            // Adicionar ao layout de RCL atual, se já não existir
            if (!roomLayout.rcl[currentRCL].some((p: PlannedStructure) => p.x === s.pos.x && p.y === s.pos.y && p.structureType === s.structureType)) {
                roomLayout.rcl[currentRCL].push({ x: s.pos.x, y: s.pos.y, structureType: s.structureType });
            }
        }
        
        // 2. Adicionar as estruturas que são idealmente planejadas (ex: estradas do spawn)
        const newlyPlannedSpawnRoads = this.generateSpawnRoads(room, spawn);
        for (const planned of newlyPlannedSpawnRoads) {
            // Adicionar ao layout de RCL atual, se já não existir (evita duplicatas com as capturadas)
            if (!roomLayout.rcl[currentRCL].some((p: PlannedStructure) => p.x === planned.x && p.y === planned.y && p.structureType === planned.structureType)) {
                roomLayout.rcl[currentRCL].push(planned);
            }
        }
        
        // TODO: Adicionar lógica para outros RCLs (2 a 8) e outros tipos de estruturas

        room.memory.layout = roomLayout;
        console.log(`[LayoutGenerator] Generated initial layout for room ${room.name}. Total planned structures for RCL ${currentRCL}: ${roomLayout.rcl[currentRCL].length}.`);
    },

    generateSpawnRoads: function(room: Room, spawn: StructureSpawn): PlannedStructure[] {
        const planned: PlannedStructure[] = [];
        if (!isSafePosition(spawn.pos)) {
            console.log(`[LayoutGenerator] Spawn at ${spawn.pos} is not safe. Skipping spawn roads generation.`);
            return planned;
        }
        
        const distance = 1; // Anel de distância 1 ao redor do spawn
        const centerPos = spawn.pos;

        for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
            for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
                // Apenas as bordas do quadrado 3x3
                if (x === centerPos.x - distance || x === centerPos.x + distance ||
                    y === centerPos.y - distance || y === centerPos.y + distance) {
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    
                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue; // Não planeja estradas em paredes
                    
                    planned.push({ x: x, y: y, structureType: STRUCTURE_ROAD });
                }
            }
        }
        return planned;
    },

    // TODO: Adicionar métodos generateExtensions, generateSourceRoads, etc.
};

export default layoutGenerator;

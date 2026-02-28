import { isSafePosition } from './blueprints/utils'; // Reutilizar isSafePosition

const layoutGenerator = {
    generateLayout: function(room: Room, spawn: StructureSpawn): void {
        const roomLayout: RoomLayoutMemory = {
            rcl: {},
            generated: true
        };

        // Geração de layout para RCL 1
        if (!roomLayout.rcl[1]) {
            roomLayout.rcl[1] = [];

            // Adicionar Estradas do Spawn para RCL 1
            const spawnRoads = this.generateSpawnRoads(room, spawn);
            roomLayout.rcl[1].push(...spawnRoads);

            // TODO: Adicionar outras estruturas para RCL 1
        }

        // TODO: Geração de layout para outros RCLs (2 a 8)

        room.memory.layout = roomLayout;
        console.log(`[LayoutGenerator] Generated initial layout for room ${room.name}. Total planned structures: ${Object.values(roomLayout.rcl).flat().length}.`);
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
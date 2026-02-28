import { isSafePosition } from './blueprints/utils';
import { generateExtensionsLayout } from './blueprints/extensions';

const layoutGenerator = {
    generateLayout: function(room: Room, spawn: StructureSpawn): void {
        const roomLayout: RoomLayoutMemory = {
            rcl: {},
            generated: true
        };

        // Planejamos para todos os RCLs do 1 até o nível atual
        const currentRCL = room.controller ? room.controller.level : 1;

        for (let rcl = 1; rcl <= currentRCL; rcl++) {
            if (!roomLayout.rcl[rcl]) {
                roomLayout.rcl[rcl] = [];
            }

            // 1. Planejar Estradas do Spawn (RCL 1+)
            if (rcl === 1) {
                const spawnRoads = this.generateSpawnRoads(room, spawn);
                roomLayout.rcl[rcl].push(...spawnRoads);
            }

            // 2. Planejar Extensões (RCL 2+)
            if (rcl >= 2) {
                const extensions = generateExtensionsLayout(room, spawn, rcl);
                // Adiciona apenas as que ainda não foram planejadas em RCLs anteriores
                for (const ext of extensions) {
                    if (!this.isAlreadyPlanned(roomLayout, ext)) {
                        roomLayout.rcl[rcl].push(ext);
                    }
                }
            }
            
            // TODO: Adicionar outros geradores (Torres, Containers, etc.) conforme implementarmos
        }

        room.memory.layout = roomLayout;
        const total = Object.values(roomLayout.rcl).reduce((sum, list) => sum + list.length, 0);
        console.log(`[LayoutGenerator] Clean layout generated for room ${room.name}. Total planned structures: ${total}.`);
    },

    isAlreadyPlanned: function(layout: RoomLayoutMemory, structure: PlannedStructure): boolean {
        for (const rcl in layout.rcl) {
            if (layout.rcl[rcl].some(p => p.x === structure.x && p.y === structure.y && p.structureType === structure.structureType)) {
                return true;
            }
        }
        return false;
    },

    generateSpawnRoads: function(room: Room, spawn: StructureSpawn): PlannedStructure[] {
        const planned: PlannedStructure[] = [];
        const distance = 1; 
        const centerPos = spawn.pos;

        for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
            for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
                if (x === centerPos.x - distance || x === centerPos.x + distance ||
                    y === centerPos.y - distance || y === centerPos.y + distance) {
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;
                    planned.push({ x: x, y: y, structureType: STRUCTURE_ROAD });
                }
            }
        }
        return planned;
    }
};

export default layoutGenerator;
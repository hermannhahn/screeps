import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad, isRoadPathComplete, findTargetForRoadConnection } from './utils';

const exitRoadsBlueprint: Blueprint = {
    name: "Exit Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const exits = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
        let sitesCreated = 0;

        for (const exitDir of exits) {
            const exitPositions = room.find(exitDir);
            if (exitPositions.length === 0) continue;

            // Agrupar posições de saída contíguas em seções
            const sections: RoomPosition[] = [];
            if (exitPositions.length > 0) {
                // Simplificação: pegar o ponto médio de cada bloco contínuo de saída
                // Para este script, vamos apenas pegar o ponto médio total se houver poucos, 
                // ou dividir se houver grandes espaços.
                // Mas para a maioria das salas, um ponto por direção é suficiente.
                // Vamos tentar detectar se há múltiplos grupos.
                
                let currentSection: RoomPosition[] = [exitPositions[0]];
                for (let i = 1; i < exitPositions.length; i++) {
                    const prev = exitPositions[i-1];
                    const curr = exitPositions[i];
                    if (Math.abs(prev.x - curr.x) <= 1 && Math.abs(prev.y - curr.y) <= 1) {
                        currentSection.push(curr);
                    } else {
                        sections.push(currentSection[Math.floor(currentSection.length / 2)]);
                        currentSection = [curr];
                    }
                }
                sections.push(currentSection[Math.floor(currentSection.length / 2)]);
            }

            for (const sectionPos of sections) {
                sitesCreated += planRoadsFromToNearestRoad(room, sectionPos);
                if (sitesCreated > 0) return sitesCreated; // Plan one at a time to stay under CS limits and keep order
            }
        }

        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const exits = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
        
        for (const exitDir of exits) {
            const exitPositions = room.find(exitDir);
            if (exitPositions.length === 0) continue;

            const sections: RoomPosition[] = [];
            let currentSection: RoomPosition[] = [exitPositions[0]];
            for (let i = 1; i < exitPositions.length; i++) {
                const prev = exitPositions[i-1];
                const curr = exitPositions[i];
                if (Math.abs(prev.x - curr.x) <= 1 && Math.abs(prev.y - curr.y) <= 1) {
                    currentSection.push(curr);
                } else {
                    sections.push(currentSection[Math.floor(currentSection.length / 2)]);
                    currentSection = [curr];
                }
            }
            sections.push(currentSection[Math.floor(currentSection.length / 2)]);

            for (const sectionPos of sections) {
                const targetPos = findTargetForRoadConnection(room, sectionPos);
                if (!targetPos) continue;

                if (!isRoadPathComplete(room, sectionPos, targetPos)) {
                    return false;
                }
            }
        }
        return true;
    }
};

export default exitRoadsBlueprint;

import _ from 'lodash';
import { findPrioritizedHostileCreep } from './utils.combat';

const roleArcher = {
    run: function(creep: Creep) {
        const target = findPrioritizedHostileCreep(creep);

        if (target) {
            // Se o alvo estiver a 3 tiles de distância, ataca
            if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                // Se estiver muito perto (range 1 ou 2), tenta se afastar
                if (creep.pos.inRangeTo(target, 2)) {
                    const fleePath = PathFinder.search(
                        creep.pos,
                        { pos: target.pos, range: 3 },
                        { flee: true, roomCallback: (roomName: string) => { // Adicionado o tipo string
                            const room = Game.rooms[roomName];
                            if (!room) return false;
                            const costs = new PathFinder.CostMatrix();
                            room.find(FIND_STRUCTURES).forEach(function(s: Structure) { // Adicionado o tipo Structure
                                if (s.structureType === STRUCTURE_ROAD) {
                                    // Personaliza para estradas
                                    costs.set(s.pos.x, s.pos.y, 1);
                                } else if (s.structureType !== STRUCTURE_CONTAINER && (s.structureType !== STRUCTURE_RAMPART || !s.my)) {
                                    // Evita estruturas que não sejam containers ou ramparts do próprio jogador
                                    costs.set(s.pos.x, s.pos.y, 0xff);
                                }
                            });
                            return costs;
                        }}
                    );                    if (fleePath.path.length > 0) {
                        creep.moveByPath(fleePath.path);
                    } else {
                        // Se não conseguir fugir, pelo menos se move para o range 3
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else { // Se não estiver em range ideal, move para o range 3
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        } else {
            // Se não houver inimigos, mover-se para perto do spawn ou um ponto de rally defensivo
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (spawn) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};

export default roleArcher;
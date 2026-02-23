import _ from 'lodash';

// Reutilizar a função auxiliar de priorização de hostis, pois a lógica é a mesma
// Para evitar duplicação em scripts diferentes, esta função deveria estar em um módulo de utilidade.
// Mas para este escopo, a manterei aqui.
function findPrioritizedHostileCreep(creep: Creep): Creep | null {
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) {
        return null;
    }

    hostiles.sort((a, b) => {
        // Prioridade 1: ATTACK ou RANGED_ATTACK
        const aHasAttack = a.getActiveBodyparts(ATTACK) > 0 || a.getActiveBodyparts(RANGED_ATTACK) > 0;
        const bHasAttack = b.getActiveBodyparts(ATTACK) > 0 || b.getActiveBodyparts(RANGED_ATTACK) > 0;
        if (aHasAttack && !bHasAttack) return -1;
        if (!aHasAttack && bHasAttack) return 1;

        // Prioridade 2: HEAL
        const aHasHeal = a.getActiveBodyparts(HEAL) > 0;
        const bHasHeal = b.getActiveBodyparts(HEAL) > 0;
        if (aHasHeal && !bHasHeal) return -1;
        if (!aHasHeal && bHasHeal) return 1;

        // Prioridade 3: WORK
        const aHasWork = a.getActiveBodyparts(WORK) > 0;
        const bHasWork = b.getActiveBodyparts(WORK) > 0;
        if (aHasWork && !bHasWork) return -1;
        if (!aHasWork && bHasWork) return 1;

        // Último critério: closestByRange
        return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
    });

    return hostiles[0];
}


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
                        { flee: true, roomCallback: (roomName) => {
                            const room = Game.rooms[roomName];
                            if (!room) return false;
                            const costs = new PathFinder.CostMatrix();
                            room.find(FIND_STRUCTURES).forEach(function(s) {
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
                    );
                    if (fleePath.path.length > 0) {
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
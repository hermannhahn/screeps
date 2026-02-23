import _ from 'lodash';

// Função auxiliar para encontrar o creep hostil de maior prioridade para um creep defensor
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


const roleGuard = {
    run: function(creep: Creep) {
        const target = findPrioritizedHostileCreep(creep);

        if (target) {
            if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
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

export default roleGuard;
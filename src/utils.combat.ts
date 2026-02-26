// src/utils.combat.ts

import _ from 'lodash';

/**
 * Finds the highest priority hostile creep for a given attacker.
 * Priority is based on body parts (ATTACK/RANGED_ATTACK > HEAL > WORK) and then proximity.
 * @param attacker The creep or structure (e.g., Tower) performing the attack. Must have a .pos property.
 * @returns The highest priority hostile creep, or null if none found.
 */
export function findPrioritizedHostileCreep(attacker: Creep | StructureTower | StructureSpawn): Creep | null {
    const hostiles = attacker.room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) {
        return null;
    }

    hostiles.sort((a, b) => {
        // Priority 1: ATTACK or RANGED_ATTACK parts
        const aHasAttack = a.getActiveBodyparts(ATTACK) > 0 || a.getActiveBodyparts(RANGED_ATTACK) > 0;
        const bHasAttack = b.getActiveBodyparts(ATTACK) > 0 || b.getActiveBodyparts(RANGED_ATTACK) > 0;
        if (aHasAttack && !bHasAttack) return -1;
        if (!aHasAttack && bHasAttack) return 1;

        // Priority 2: HEAL parts
        const aHasHeal = a.getActiveBodyparts(HEAL) > 0;
        const bHasHeal = b.getActiveBodyparts(HEAL) > 0;
        if (aHasHeal && !bHasHeal) return -1;
        if (!aHasHeal && bHasHeal) return 1;

        // Priority 3: WORK parts (harvesters, upgraders, builders)
        const aHasWork = a.getActiveBodyparts(WORK) > 0;
        const bHasWork = b.getActiveBodyparts(WORK) > 0;
        if (aHasWork && !bHasWork) return -1;
        if (!aHasWork && bHasWork) return 1;

        // Last criterion: closestByRange
        return attacker.pos.getRangeTo(a) - attacker.pos.getRangeTo(b);
    });

    return hostiles[0];
}

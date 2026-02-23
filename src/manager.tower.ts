import _ from 'lodash';

// Função auxiliar para encontrar o creep hostil de maior prioridade
function findPrioritizedHostile(room: Room, tower: StructureTower): Creep | null {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) {
        return null;
    }

    // Ordena os creeps com base na prioridade
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
        return tower.pos.getRangeTo(a) - tower.pos.getRangeTo(b);
    });

    return hostiles[0];
}

export const managerTower = {
    run(room: Room): void {
        // Assegurar que room.memory.primaryHostileTargetId existe e tem um tipo adequado
        if (!room.memory.primaryHostileTargetId) {
            room.memory.primaryHostileTargetId = null;
        }

        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_TOWER
        }) as StructureTower[];

        // Se houver torres na sala
        if (towers.length > 0) {
            let primaryTarget: Creep | null = null;

            // Tentar obter o alvo primário da memória
            if (room.memory.primaryHostileTargetId) {
                const storedTarget = Game.getObjectById(room.memory.primaryHostileTargetId);
                if (storedTarget && (storedTarget instanceof Creep)) {
                    primaryTarget = storedTarget;
                } else {
                    // Alvo armazenado não é mais válido, resetar
                    room.memory.primaryHostileTargetId = null;
                }
            }

            // Se não há alvo primário válido, encontrar um novo
            if (!primaryTarget) {
                // Usar a primeira torre para encontrar o alvo prioritário para toda a sala
                // Isso garante que todas as torres ataquem o mesmo alvo
                if (towers[0]) {
                     primaryTarget = findPrioritizedHostile(room, towers[0]);
                     if (primaryTarget) {
                         room.memory.primaryHostileTargetId = primaryTarget.id;
                     }
                }
            }

            for (const tower of towers) {
                if (primaryTarget) {
                    tower.attack(primaryTarget);
                } else {
                    // Lógica de reparo se não houver inimigos ativos

                    let structureToRepair: AnyStructure | null = null;

                    // Prioridade 1: Estruturas CRÍTICAS em risco IMEDIATO
                    // Exemplos: Spawn, Controller, Containers
                    const criticalStructures = room.find(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_CONTROLLER || s.structureType === STRUCTURE_CONTAINER)
                                      && s.hits < s.hitsMax * 0.2 // Repara se abaixo de 20%
                    });
                    if (criticalStructures.length > 0) {
                        criticalStructures.sort((a, b) => a.hits - b.hits); // Repara o mais danificado
                        structureToRepair = criticalStructures[0];
                    }

                    if (!structureToRepair) {
                        // Prioridade 2: Walls e Ramparts até o limite definido
                        const defensiveStructures = room.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART)
                                          && s.hits < 10000 // Nosso limite atual
                        });
                        if (defensiveStructures.length > 0) {
                            defensiveStructures.sort((a, b) => a.hits - b.hits);
                            structureToRepair = defensiveStructures[0];
                        }
                    }

                    if (!structureToRepair) {
                        // Prioridade 3: Outras estruturas até 90%
                        const otherDamagedStructures = room.find(FIND_STRUCTURES, {
                            filter: (s) => s.hits < s.hitsMax * 0.9
                        });
                        if (otherDamagedStructures.length > 0) {
                            otherDamagedStructures.sort((a, b) => a.hits - b.hits);
                            structureToRepair = otherDamagedStructures[0];
                        }
                    }

                    if (structureToRepair) {
                        tower.repair(structureToRepair);
                    }
                }
            }
        }
    }
};
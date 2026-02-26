import _ from 'lodash';
import { findPrioritizedHostileCreep } from './utils.combat';

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
                     primaryTarget = findPrioritizedHostileCreep(towers[0]);
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
                        // Prioridade 2: Walls e Ramparts até o limite definido escalável por RCL
                        const rcl = room.controller?.level || 1;
                        let wallThreshold = 10000;
                        if (rcl === 4) wallThreshold = 50000;
                        else if (rcl === 5) wallThreshold = 100000;
                        else if (rcl === 6) wallThreshold = 250000;
                        else if (rcl === 7) wallThreshold = 500000;
                        else if (rcl >= 8) wallThreshold = 1000000;

                        const defensiveStructures = room.find(FIND_STRUCTURES, {
                            filter: (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART)
                                          && s.hits < wallThreshold
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
import taskDeliver from './task.deliver';
import taskCollectEnergy from './task.collectEnergy';

const roleRemoteHarvester = {
    run: function(creep: Creep) {
        // Se a sala alvo ou a sala de origem não estiverem definidas, o creep não faz nada.
        if (!creep.memory.targetRoom || !creep.memory.homeRoom) {
            console.log(`${creep.name} has no target room or home room defined.`);
            return;
        }

        // Lógica de detecção de inimigos (em qualquer sala)
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
        });

        if (hostileCreeps.length > 0) {
            // Se houver inimigos, fugir para a homeRoom
            const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
            creep.moveTo(pos, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
            creep.say('😱');
            
            // Se estiver na sala alvo, marcar como insegura na memória do RemoteManager
            if (creep.room.name === creep.memory.targetRoom && Memory.remoteRooms && Memory.remoteRooms[creep.room.name]) {
                Memory.remoteRooms[creep.room.name].safe = false;
                Memory.remoteRooms[creep.room.name].lastScouted = Game.time;
            }
            return;
        }

        // Se o creep estiver na sala de origem (homeRoom) e tiver energia, entregue-a.
        if (creep.room.name === creep.memory.homeRoom) {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                // Tenta entregar na sala de origem usando a lógica existente.
                const delivered = taskDeliver.run(creep);
                if (!delivered) {
                    // Se não houver onde entregar, o creep pode esperar ou ir para a sala alvo novamente
                    // Por enquanto, apenas reportamos que não há onde entregar.
                    // console.log(`${creep.name} in home room ${creep.memory.homeRoom} has energy but no delivery target.`);
                }
            } else {
                // Se o creep estiver na sala de origem e não tiver energia, vá para a sala alvo.
                const pos = new RoomPosition(25, 25, creep.memory.targetRoom);
                creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
                creep.memory.working = false; // Garante que o estado de trabalho é de coleta
            }
            return; // Termina a execução para este tick
        }

        // Se o creep estiver na sala alvo (targetRoom)
        if (creep.room.name === creep.memory.targetRoom) {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                // Se ainda pode carregar energia, coleta.
                let source: Source | null = null;
                if (creep.memory.remoteSourceId) {
                    source = Game.getObjectById(creep.memory.remoteSourceId as Id<Source>);
                }

                if (!source) {
                    // Tenta encontrar uma nova source se a memória estiver vazia ou inválida
                    const sources = creep.room.find(FIND_SOURCES);
                    if (sources.length > 0) {
                        source = sources[0]; // Simplificado: pega a primeira source disponível
                        creep.memory.remoteSourceId = source.id;
                    }
                }

                if (source) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    creep.memory.working = false; // Garante que o estado de trabalho é de coleta
                } else {
                    // Não há fontes na sala alvo, ou elas estão exauridas. Mova-se para a homeRoom.
                    const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
                    creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
                    creep.memory.working = true; // Força o retorno para entregar o que tem (se tiver)
                }
            } else {
                // Se a mochila estiver cheia, volte para a sala de origem para entregar.
                const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
                creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
                creep.memory.working = true; // Garante que o estado de trabalho é de entrega
            }
            return; // Termina a execução para este tick
        }

        // Se o creep não estiver em nenhuma das salas (está no caminho)
        // A lógica de moveTo acima já cuida disso, então não precisamos de um bloco else aqui.
        // O creep simplesmente continuará a mover-se para a sala designada em seu próximo tick.
    }
};

export default roleRemoteHarvester;

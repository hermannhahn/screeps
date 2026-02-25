import taskDeliver from './task.deliver';

const roleCarrier = {
    run: function(creep: Creep) {
        // Se a sala alvo, a sala de origem ou o container remoto não estiverem definidos, o creep não faz nada.
        if (!creep.memory.targetRoom || !creep.memory.homeRoom || !creep.memory.remoteContainerId) {
            console.log(`${creep.name} has no target room, home room, or remote container defined.`);
            return;
        }

        // Se o creep estiver carregando energia e na sala de origem (homeRoom), entregue-a.
        if (creep.memory.working && creep.room.name === creep.memory.homeRoom) {
            const delivered = taskDeliver.run(creep);
            if (!delivered && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                // Se não houver onde entregar na homeRoom, o creep pode esperar ou tentar novamente
                // console.log(`${creep.name} in home room ${creep.memory.homeRoom} has energy but no delivery target.`);
            } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                // Se entregou tudo, mude para o estado de coleta
                creep.memory.working = false;
                // Limpa o target de entrega para que a lógica de deliver possa encontrar um novo (se necessário)
                delete creep.memory.deliveryTargetId;
            }
            return; // Termina a execução para este tick
        }

        // Se o creep estiver na sala alvo (targetRoom)
        if (creep.room.name === creep.memory.targetRoom) {
            const remoteContainer = Game.getObjectById(creep.memory.remoteContainerId as Id<StructureContainer>);

            if (!remoteContainer) {
                console.log(`${creep.name} in room ${creep.memory.targetRoom} cannot find remote container ${creep.memory.remoteContainerId}.`);
                // Se não encontrar o container, pode voltar para homeRoom ou esperar.
                const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
                creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
                return;
            }

            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                // Se ainda pode carregar energia, tente retirar do container.
                if (remoteContainer.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    if (creep.withdraw(remoteContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(remoteContainer, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    creep.memory.working = false; // Garante que o estado de trabalho é de coleta
                } else {
                    // Container vazio, volte para homeRoom
                    const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
                    creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
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

        // Se o creep estiver no caminho entre as salas
        // Determine se está indo para a sala alvo (para pegar energia) ou para a sala de origem (para entregar)
        if (!creep.memory.working) { // Indo para targetRoom para coletar
            const pos = new RoomPosition(25, 25, creep.memory.targetRoom);
            creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
        } else { // Indo para homeRoom para entregar
            const pos = new RoomPosition(25, 25, creep.memory.homeRoom);
            creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};

export default roleCarrier;

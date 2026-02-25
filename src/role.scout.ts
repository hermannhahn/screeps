const roleScout = {
    run: function(creep: Creep) {
        // Se não houver uma sala alvo, o scout não faz nada.
        if (!creep.memory.targetRoom) {
            console.log(`${creep.name} has no target room.`);
            return;
        }

        // Se o scout não estiver na sala alvo, mova-se para ela.
        if (creep.room.name !== creep.memory.targetRoom) {
            const pos = new RoomPosition(25, 25, creep.memory.targetRoom);
            creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
            // console.log(`${creep.name} moving to target room: ${creep.memory.targetRoom}`);
            return;
        }

        // Se o scout estiver na sala alvo, explore seus exits e mova-se para o controller.
        // Adicionar os exits da sala atual para Memory.roomsToExplore
        const exits = Game.map.describeExits(creep.room.name);
        for (const direction in exits) {
            const exitRoomName = exits[direction as ExitKey];
            // Certifica-se de que a sala não é controlada por outro jogador antes de adicionar para exploração
            // E que não é um setor de corredor ("highway") que não é de interesse inicial
            if (exitRoomName && !Memory.roomsToExplore[exitRoomName] && !(exitRoomName.includes('W') && exitRoomName.includes('E') && exitRoomName.includes('N') && exitRoomName.includes('S'))) {
                Memory.roomsToExplore[exitRoomName] = true;
                console.log(`Scout ${creep.name} added room ${exitRoomName} to roomsToExplore.`);
            }
        }

        // Move para o controller para dar visão e talvez assinar (se tiver o corpo)
        if (creep.room.controller) {
            if (!creep.pos.isNearTo(creep.room.controller.pos)) {
                creep.moveTo(creep.room.controller, { reusePath: 10, visualizePathStyle: { stroke: '#ffffff' } });
                // console.log(`${creep.name} moving to controller in ${creep.room.name}.`);
            } else if (creep.room.controller.sign && creep.room.controller.sign.username !== creep.owner.username) {
                // Se houver uma assinatura de outro jogador, tente assinar
                creep.signController(creep.room.controller, "This room is being explored by Hermann's empire.");
            }
        } else {
            // Se não houver controller (sala sem controller), apenas vagueie um pouco para dar visão.
            // Movimento aleatório simples para cobrir mais terreno
            const direction = Math.floor(Math.random() * 8) + 1 as DirectionConstant;
            creep.move(direction);
        }
    }
};

export default roleScout;

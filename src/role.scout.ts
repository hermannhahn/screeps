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

        // Se o scout estiver na sala alvo, mova-se para a bandeira alvo ou para o controller.
        const scoutTargetFlag = creep.memory.scoutTarget ? Game.flags[creep.memory.scoutTarget] : null;

        if (scoutTargetFlag) {
            // Se houver uma bandeira alvo, mova-se para ela.
            if (!creep.pos.isNearTo(scoutTargetFlag.pos)) {
                creep.moveTo(scoutTargetFlag, { reusePath: 10, visualizePathStyle: { stroke: '#ffffff' } });
                // console.log(`${creep.name} moving to flag ${scoutTargetFlag.name} in ${creep.room.name}.`);
            }
        } else if (creep.room.controller) {
            // Caso contrário, mova-se para o controller da sala.
            if (!creep.pos.isNearTo(creep.room.controller.pos)) {
                creep.moveTo(creep.room.controller, { reusePath: 10, visualizePathStyle: { stroke: '#ffffff' } });
                // console.log(`${creep.name} moving to controller in ${creep.room.name}.`);
            }
        } else {
            // Se não houver controller, apenas vagueie um pouco para dar visão.
            // Movimento aleatório simples
            const direction = Math.floor(Math.random() * 8) + 1 as DirectionConstant;
            creep.move(direction);
        }
    }
};

export default roleScout;

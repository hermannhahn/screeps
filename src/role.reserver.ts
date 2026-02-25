const roleReserver = {
    run: function(creep: Creep) {
        // Se a sala alvo não estiver definida, o creep não faz nada.
        if (!creep.memory.targetRoom) {
            console.log(`${creep.name} has no target room defined for reserving.`);
            return;
        }

        // Se o creep não estiver na sala alvo, mova-se para ela.
        if (creep.room.name !== creep.memory.targetRoom) {
            const pos = new RoomPosition(25, 25, creep.memory.targetRoom);
            creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#00ff00' } });
            // console.log(`${creep.name} moving to target room: ${creep.memory.targetRoom} to reserve.`);
            return;
        }

        // Se o creep estiver na sala alvo, tente reservar o controller.
        if (creep.room.controller) {
            if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { reusePath: 50, visualizePathStyle: { stroke: '#00ff00' } });
            } else if (creep.reserveController(creep.room.controller) === ERR_NO_CLAIM_PARTS) {
                console.log(`${creep.name} has no CLAIM parts to reserve controller.`);
                // Pode se autodestruir ou esperar ser substituído por um com CLAIM parts.
            }
        } else {
            console.log(`${creep.name} in room ${creep.memory.targetRoom} found no controller to reserve.`);
            // Se não houver controller (sala sem controller), o creep pode se autodestruir ou vaguear.
        }
    }
};

export default roleReserver;

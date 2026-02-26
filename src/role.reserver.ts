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
            const reservation = creep.room.controller.reservation;
            
            // Se a reserva já estiver quase no máximo (5000), podemos economizar CPU e apenas esperar se estivermos perto
            if (reservation && reservation.ticksToEnd >= 4999) {
                if (!creep.pos.isNearTo(creep.room.controller)) {
                    creep.moveTo(creep.room.controller, { reusePath: 50, visualizePathStyle: { stroke: '#00ff00' } });
                } else {
                    creep.say('⚡'); // Indica que está mantendo a reserva cheia
                }
                return;
            }

            if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { reusePath: 50, visualizePathStyle: { stroke: '#00ff00' } });
            } else if (creep.reserveController(creep.room.controller) === ERR_NO_BODYPART) {
                console.log(`${creep.name} has no CLAIM parts to reserve controller.`);
            }
        } else {
            console.log(`${creep.name} in room ${creep.memory.targetRoom} found no controller to reserve.`);
            // Se não houver controller (sala sem controller), o creep pode se autodestruir ou vaguear.
        }
    }
};

export default roleReserver;

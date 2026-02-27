import _ from 'lodash';
import taskDeliver from './task.deliver';

const roleRemoteHarvester = {
    run: function(creep: Creep) {
        // Inicializa o estado se necessário
        if (creep.memory.working === undefined) {
            creep.memory.working = false;
        }

        // Alterna o estado: se estiver coletando e ficar cheio, muda para entregar.
        // Se estiver entregando e ficar vazio, muda para coletar.
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚚 Return');
        }
        if (creep.memory.working && creep.store.getUsedCapacity() === 0) {
            creep.memory.working = false;
            creep.say('⛏️ Harvest');
        }

        // Sala Alvo e Home
        const targetRoom = creep.memory.targetRoom;
        const homeRoom = creep.memory.homeRoom;

        if (!targetRoom || !homeRoom) {
            console.log(`${creep.name} has no target room or home room defined.`);
            return;
        }

        // Lógica de Fuga (Hostis na sala atual)
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
        });

        if (hostileCreeps.length > 0) {
            creep.say('😱 Flee!');
            // Se estiver na sala alvo, marca como perigosa
            if (creep.room.name === targetRoom && Memory.remoteRooms && Memory.remoteRooms[targetRoom]) {
                Memory.remoteRooms[targetRoom].safe = false;
                Memory.remoteRooms[targetRoom].lastScouted = Game.time;
            }
            
            // Move para a homeRoom ou foge para o centro da sala atual se já estiver na home
            if (creep.room.name !== homeRoom) {
                const pos = new RoomPosition(25, 25, homeRoom);
                creep.moveTo(pos, { reusePath: 10, visualizePathStyle: { stroke: '#ff0000' } });
            } else {
                // Se já estiver na home e houver inimigos, apenas se afasta deles
                const goals = hostileCreeps.map(h => ({ pos: h.pos, range: 5 }));
                const retreat = PathFinder.search(creep.pos, goals, { flee: true });
                if (retreat.path.length > 0) {
                    creep.move(creep.pos.getDirectionTo(retreat.path[0]));
                }
            }
            return;
        }

        // EXECUÇÃO DOS ESTADOS
        if (creep.memory.working) {
            // ESTADO: ENTREGAR
            if (creep.room.name === homeRoom) {
                // Na homeRoom, tenta entregar
                const delivered = taskDeliver.run(creep);
                if (!delivered) {
                    // Se não houver onde entregar, move para perto do storage ou centro
                    const target = creep.room.storage || creep.room.find(FIND_MY_SPAWNS)[0];
                    if (target && creep.pos.getRangeTo(target) > 3) {
                        creep.moveTo(target, { reusePath: 10 });
                    }
                }
            } else {
                // Não está na homeRoom, mova-se para lá
                const pos = new RoomPosition(25, 25, homeRoom);
                creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            // ESTADO: COLETAR
            if (creep.room.name === targetRoom) {
                // Na sala alvo, encontrar fonte
                let source: Source | null = null;
                
                if (creep.memory.remoteSourceId) {
                    source = Game.getObjectById(creep.memory.remoteSourceId as Id<Source>);
                }

                // Se não tiver fonte ou a fonte estiver em outra sala (id inválido no contexto atual)
                if (!source) {
                    const sources = creep.room.find(FIND_SOURCES);
                    if (sources.length > 0) {
                        // Balanceamento: Escolher a fonte com menos harvesters por perto
                        source = _.minBy(sources, (s) => {
                            const nearbyHarvesters = s.pos.findInRange(FIND_CREEPS, 2, {
                                filter: (c) => c.memory.role === 'remoteHarvester' || c.memory.role === 'harvester'
                            });
                            return nearbyHarvesters.length;
                        }) || sources[0];
                        creep.memory.remoteSourceId = source.id;
                    }
                }

                if (source) {
                    const harvestResult = creep.harvest(source);
                    if (harvestResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { reusePath: 20, visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // Sala alvo sem fontes visíveis? (Estranho, mas por segurança volta)
                    const pos = new RoomPosition(25, 25, homeRoom);
                    creep.moveTo(pos, { reusePath: 50 });
                }
            } else {
                // Não está na sala alvo, mova-se para lá
                const pos = new RoomPosition(25, 25, targetRoom);
                creep.moveTo(pos, { reusePath: 50, visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};

export default roleRemoteHarvester;

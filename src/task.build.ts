import _ from 'lodash';
import { getIncomingWork } from './utils.creep';

const taskBuild = {
    run: function(creep: Creep): boolean {
        // Encontrar todos os alvos válidos na sala
        const targets = creep.room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs) => {
                // Se já é o meu alvo atual, mantemos na lista para o findClosestByPath considerar
                if (creep.memory.targetBuildId === cs.id) return true;
                // Caso contrário, verifica se não há builders demais (incomingWork)
                return getIncomingWork(cs.id, 'targetBuildId') < 10;
            }
        });

        if (targets.length === 0) {
            delete creep.memory.targetBuildId;
            return false;
        }

        // SEMPRE buscar o canteiro de obras mais próximo pelo caminho
        const target = creep.pos.findClosestByPath(targets);

        if (target) {
            creep.memory.targetBuildId = target.id;
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true;
        }

        delete creep.memory.targetBuildId;
        return false;
    }
};

export default taskBuild;

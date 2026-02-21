const taskBuild = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        let target = null;

        if (targets.length > 0) {
            targets.sort((a, b) => {
                // Prioriza o mais avançado
                const progressA = a.progress / a.progressTotal;
                const progressB = b.progress / b.progressTotal;
                if (progressA !== progressB) {
                    return progressB - progressA; // Maior progresso primeiro
                }
                // Se o progresso for igual, prioriza o mais próximo
                return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
            });
            target = targets[0];
        }

        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true; // Successfully assigned a building task
        }
        return false; // No construction sites found or no action taken
    }
};

module.exports = taskBuild;
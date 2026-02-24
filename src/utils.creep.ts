import _ from 'lodash';

export const getIncomingEnergy = (targetId: Id<any>): number => {
    return _.sumBy(_.filter(Game.creeps, (c) => c.memory.deliveryTargetId === targetId), (c) => c.store.getUsedCapacity(RESOURCE_ENERGY));
};

export const getIncomingCollection = (targetId: Id<any>): number => {
    return _.sumBy(_.filter(Game.creeps, (c) => c.memory.targetEnergyId === targetId), (c) => c.store.getFreeCapacity(RESOURCE_ENERGY));
};

export const getIncomingWork = (targetId: Id<any>, memoryKey: 'targetBuildId' | 'targetRepairId'): number => {
    return _.sumBy(_.filter(Game.creeps, (c) => c.memory[memoryKey] === targetId), (c) => c.getActiveBodyparts(WORK));
};

export const isValidTarget = (target: any, role: string): boolean => {
    if (!target) return false;
    if (target instanceof Creep) return target.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    if (target instanceof Resource) return target.amount > 0;
    if (target instanceof ConstructionSite) return true;
    if ('store' in target) {
        if (role === 'supplier' || role === 'deliverer') {
             return target.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        } else {
             return target.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
    }
    if ('hits' in target && 'hitsMax' in target) return target.hits < target.hitsMax;
    return false;
};

// src/declarations.d.ts
import { LoDashStatic } from 'lodash';

declare global {
    const _: LoDashStatic;

    interface CreepMemory {
        role: string;
        building?: boolean;
        upgrading?: boolean;
        sourceId?: Id<Source>;
        targetId?: Id<any>;
        lastAction?: string;
        targetRoom?: string;
        homeRoom?: string;
    }

    interface Memory {
        initialized?: boolean;
        planning?: MemoryPlanning;
        remoteMining?: { [roomName: string]: RemoteMiningData };
    }

    interface RemoteMiningData {
        sources: Id<Source>[];
        reserverNeeded: boolean;
        isHostile: boolean;
        lastScouted: number;
    }

    interface MemoryPlanning {
        plannedStructures: PlannedStructure[];
        spawnSquareRoadAnchorPositions: RoomPosition[];
        currentStage: number;
    }

    interface PlannedStructure {
        pos: RoomPosition;
        structureType: StructureConstant;
        status: 'planning' | 'to_build' | 'building' | 'built' | 'blocked';
    }
}

export {};

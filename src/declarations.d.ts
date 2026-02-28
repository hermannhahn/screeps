// src/declarations.d.ts
import { LoDashStatic } from 'lodash';

declare global {
    const _: LoDashStatic;

    interface CreepMemory {
        role: string;
        building?: boolean;
        upgrading?: boolean;
        sourceId?: Id<Source>;
        targetId?: Id<any>; // Alvo atual para coleta ou entrega
    }

    interface Memory {
        initialized?: boolean;
        planning?: MemoryPlanning;
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

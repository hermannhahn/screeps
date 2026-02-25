interface RoomMemory {
    blueprintStage?: number; // Made optional to match previous usage
    maxBlueprintStageCompleted: number;
    currentBlueprintStage: number;
    primaryHostileTargetId?: Id<Creep> | null; // Adicionado para o foco de fogo das torres
}

interface CreepMemory {
    role: string;
    room?: string;
    working?: boolean;
    sourceId?: Id<Source>;
    targetEnergyId?: Id<any>;
    targetRepairId?: Id<AnyStructure>;
    targetBuildId?: Id<ConstructionSite>;
    deliveryTargetId?: Id<any>;
    assignedSupplier?: Id<Creep>;
    delivering?: boolean;
    building?: boolean;
    repairing?: boolean;
    targetRoom?: string;
    scoutTarget?: string;
}

// Global Memory
interface Memory {
    uuid: number;
    log: any;
    primaryHostileTargetId?: Id<Creep> | null; // Adicionado para o foco de fogo das torres
}

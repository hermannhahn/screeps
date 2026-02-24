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
    deliveryTargetId?: Id<any>;
    assignedSupplier?: Id<Creep>;
    delivering?: boolean;
}

// Global Memory
interface Memory {
    uuid: number;
    log: any;
    primaryHostileTargetId?: Id<Creep> | null; // Adicionado para o foco de fogo das torres
}

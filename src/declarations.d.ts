interface RoomMemory {
    blueprintStage?: number; // Made optional to match previous usage
    maxBlueprintStageCompleted: number;
    currentBlueprintStage: number;
    primaryHostileTargetId?: Id<Creep> | null; // Adicionado para o foco de fogo das torres
}

// Global Memory
interface Memory {
    uuid: number;
    log: any;
    primaryHostileTargetId?: Id<Creep> | null; // Adicionado para o foco de fogo das torres
}

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

declare global {
    interface RoomMemory {
        travelTimes?: { [key: string]: number };
    }
    interface CreepMemory {
        role: string;
        sourceId?: Id<Source>;
        targetEnergyId?: Id<any>;
        deliveryTargetId?: Id<any>;
        assignedSupplier?: Id<Creep>;
        upgrading?: boolean;
        building?: boolean;
        state?: string;
        repairing?: boolean;
    }
    interface RoomPosition {
        isWalkable(creepLooking?: Creep): boolean;
        getAdjacentPositions(): RoomPosition[];
        hasCreep(): boolean;
        findAdjacentWalkableSpot(): RoomPosition | null;
    }
}

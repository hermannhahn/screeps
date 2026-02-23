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

const OBSTACLE_OBJECT_TYPES: string[] = [
    STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_WALL,
    STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_CONTROLLER,
    STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_OBSERVER,
    STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_LAB, STRUCTURE_TERMINAL,
    STRUCTURE_NUKER, STRUCTURE_FACTORY, STRUCTURE_POWER_BANK
];

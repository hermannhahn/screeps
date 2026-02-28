interface CreepMemory {
    role: string;
    room?: string;
    working?: boolean;
    building?: boolean;
    repairing?: boolean;
    upgrading?: boolean;
    sourceId?: Id<Source>;
    targetId?: Id<AnyStructure | Creep | ConstructionSite | Resource>;
    targetEnergyId?: Id<AnyStructure | Creep | ConstructionSite | Resource>;
    targetBuildId?: Id<ConstructionSite>;
    targetRepairId?: Id<AnyStructure>;
    deliveryTargetId?: Id<AnyStoreStructure>; // Adicionado para task.deliver e carrier
    assignedSupplier?: Id<Creep>;
    targetRoom?: string;
    homeRoom?: string;
    remoteContainerId?: Id<StructureContainer>;
    travelPath?: RoomPosition[];
    fleePath?: RoomPosition[];
    delivering?: boolean; // Adicionado para role.supplier e carrier
    remoteSourceId?: Id<Source>; // Adicionado para remoteHarvester
}

interface RoomMemory {
    // Other room memory properties
    layout?: RoomLayoutMemory; // Adicionado para o novo planner
    primaryHostileTargetId?: Id<Creep>; // Adicionado para manager.tower
}

interface SourceMemory {
    id: Id<Source>;
    roomName: string;
    pos: RoomPosition;
    harvesterCount: number;
}

interface FlagMemory {
    // Other flag memory properties
}

interface MineralMemory {
    // Mineral memory properties
}

interface RemoteRoomMemory {
    name: string;
    safe: boolean;
    lastScouted: number;
    sources: { id: Id<Source>, pos: RoomPosition }[];
    controller?: { id: Id<StructureController>, pos: RoomPosition };
    lastHarvestTick?: number;
    hasEnemyStructures?: boolean; // Adicionado para manager.spawner
    needsReserving?: boolean; // Adicionado para manager.spawner
}

interface PlannedStructure {
    x: number;
    y: number;
    structureType: BuildableStructureConstant;
}

interface RoomLayoutMemory {
    rcl: {
        [rclLevel: number]: PlannedStructure[];
    };
    generated: boolean;
}


interface Memory {
    rooms: {
        [roomName: string]: RoomMemory; // Usa a nova RoomMemory
    };
    creeps: {
        [name: string]: CreepMemory;
    };
    flags: {
        [name: string]: FlagMemory;
    };
    minerals: {
        [id: string]: MineralMemory;
    };
    remoteRooms: {
        [roomName: string]: RemoteRoomMemory;
    };
    uuid: number;
    log: any;
    roomsToExplore?: string[]; // Adicionado para manager.spawner e role.scout
}


// `global` extension for Screeps global objects
declare namespace NodeJS {
    interface Global {
        log: any;
    }
}

// Screeps global objects
declare const _: _.LoDashStatic;
declare const Game: Game;
declare const Memory: Memory;
declare const RawMemory: RawMemory;
declare const PathFinder: PathFinder;
declare const InterShardMemory: InterShardMemory;
declare const PowerCreep: PowerCreepConstructor;

// Extend RoomPosition prototype
interface RoomPosition {
    isWalkable(creepLooking?: Creep): boolean;
    getAdjacentPositions(): RoomPosition[];
    hasCreep(): boolean;
    findAdjacentWalkableSpot(): RoomPosition | null;
}

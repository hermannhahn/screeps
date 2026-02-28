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
    targetDeliverId?: Id<AnyStructure>;
    assignedSupplier?: Id<Creep>;
    targetRoom?: string;
    homeRoom?: string;
    remoteContainerId?: Id<StructureContainer>;
    travelPath?: RoomPosition[];
    fleePath?: RoomPosition[];
}

interface RoomMemory {
    // Other room memory properties
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
        [roomName: string]: {
            layout?: RoomLayoutMemory;
            // ... outras propriedades da sala
        };
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

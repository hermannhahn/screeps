interface Blueprint {
    name: string;
    plan(room: Room, spawn: StructureSpawn): number;
    isComplete(room: Room, spawn: StructureSpawn): boolean;
}

export { Blueprint };

// src/declarations.d.ts

// Declare global types that are not statically known to TypeScript.
// This is common in environments like Screeps where global objects are augmented at runtime.

// Declare the global Memory object, adding properties that are set at runtime.
declare global {
    interface Memory {
        initialized?: boolean;
        planning?: MemoryPlanning; // Corresponds to MemoryPlanning interface from manager.planner.ts
        // Add other global memory properties here as they are introduced.
    }

    // Note: The interfaces MemoryPlanning and PlannedStructure are defined in src/manager.planner.ts
    // and should be resolvable via module imports. If TypeScript still complains about them,
    // they might need to be declared here as well, but typically module imports suffice.
}

// This export is good practice for declaration files.
export {};

# Utils Tool

The `tool.utils.ts` module provides lightweight alternatives to `lodash` functions. This helps reduce CPU overhead and project dependencies.

## Key Functions

### 1. `getClosestByRange`
- **Goal**: Find the closest object from an array based on range.
- **Why**: Native `pos.findClosestByRange` is efficient, but sometimes we need to filter an existing array without re-scanning the room.

### 2. `groupBy`
- (Future) Group objects by a specific property.

### 3. `minBy` / `maxBy`
- (Future) Find an object in an array based on a numeric property (e.g., lowest hits).

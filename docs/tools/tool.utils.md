# Utils Tool

The `tool.utils.ts` module provides lightweight alternatives to `lodash` functions. This helps reduce CPU overhead and project dependencies.

## Key Functions

### 1. `isEmpty`
- **Goal**: Simple array check to replace `_.isEmpty()`.

### 2. `minBy`
- **Goal**: Find object with minimum property value (replaces `_.minBy`).

### 3. `isSafe`
- **Goal**: Checks if a position is safe from enemies (hostile creeps or structures).
- **Why**: Prevent creeps from entering dangerous areas or placing construction sites near enemies.

### 4. `getSafeSources`
- **Goal**: Returns a list of sources that are safe from enemies within a 10-block range.
- **Why**: Used by the Spawner and Harvesters to avoid dangerous sources.

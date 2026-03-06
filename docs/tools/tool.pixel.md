# Pixel Generator Tool

The `tool.pixel.ts` module handles the automated generation of pixels when the CPU bucket is at its limit.

## Logic Overview

- **Official Server Check**: To avoid errors on private servers or simulation modes, the script only runs if the shard name starts with `shard`.
- **Bucket Condition**: Pixels are only generated when the bucket reaches 10,000 CPU. This ensures that the room logic always has enough CPU reserve.
- **Safety**: Checks if the `Game.cpu.generatePixel` method exists before calling it.

## Benefits

- Automatically accumulates pixels for future use or trading.
- Optimizes "wasted" CPU when the bucket is already full.

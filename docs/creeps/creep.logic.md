# Creep General Logic

The `creep.logic.ts` module handles global behaviors shared by all creeps, regardless of their specific role. This ensures a consistent behavior across the bot.

## Main Responsibilities

- **Memory Cleanup**: Ensures that when a creep dies, its memory is wiped to avoid clutter. (Handled in `main.ts`).
- **Target Persistence**: Provides helper methods to cache targets in memory to avoid recalculating every tick.
- **State Management**: Standardizes the "working" vs "refilling" state transition.
- **Renew Logic**: (Optional) Logic to renew creeps at the nearest spawn when they are low on TTL (Time to Live).

## Common State Flow

Most roles follow a simple pattern:
1. If the creep is empty, it switches to "Collecting Energy" mode.
2. If the creep is full, it switches to "Working" mode.
3. It performs the action specific to its role.

This logic is centralized here to reduce code duplication in each `role.*.ts` file.

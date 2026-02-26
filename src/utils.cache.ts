// src/utils.cache.ts

import _ from 'lodash';

/**
 * A simple global cache utility to reduce CPU usage by caching expensive find operations.
 * This cache resides in the 'global' object, meaning it persists between ticks on the same node,
 * but will be reset if the global environment is re-initialized (script reload or node switch).
 */

const CACHE_TIMEOUT = 50; // Ticks before a cache entry is considered stale

interface CacheEntry {
    data: any;
    timestamp: number;
}

const globalCache: { [key: string]: CacheEntry } = {};

export const cacheUtils = {
    /**
     * Retrieves data from cache or executes the provider function if not found or stale.
     * @param key Unique key for the cached data.
     * @param provider Function that returns the data if cache is empty or stale.
     * @param timeout Optional timeout override in ticks.
     */
    get: function<T>(key: string, provider: () => T, timeout: number = CACHE_TIMEOUT): T {
        const entry = globalCache[key];
        const now = Game.time;

        if (entry && (now - entry.timestamp < timeout)) {
            return entry.data as T;
        }

        const freshData = provider();
        globalCache[key] = {
            data: freshData,
            timestamp: now
        };

        return freshData;
    },

    /**
     * Specifically for room.find operations, caching them for a few ticks.
     */
    findInRoom: function<T extends FindConstant>(room: Room, type: T, filter?: (obj: any) => boolean): any[] {
        const filterStr = filter ? filter.toString() : 'none';
        const key = `find_${room.name}_${type}_${filterStr}`;
        
        return this.get(key, () => room.find(type, filter ? { filter } : undefined), 10); // Find results cached for 10 ticks
    },

    /**
     * Invalidates a specific cache key.
     */
    invalidate: function(key: string): void {
        delete globalCache[key];
    }
};

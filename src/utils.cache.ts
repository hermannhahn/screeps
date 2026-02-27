// src/utils.cache.ts

import _ from 'lodash';

/**
 * A simple global cache utility to reduce CPU usage by caching expensive find operations.
 * This cache resides in the 'global' object, meaning it persists between ticks on the same node.
 */

const DEFAULT_TIMEOUT = 50;
const TICK_TIMEOUT = 1; // Cache for the current tick only
const LONG_TIMEOUT = 500; // Cache for permanent objects

interface CacheEntry {
    data: any;
    timestamp: number;
}

// Global variable for persistence across ticks (on the same node)
const globalCache: { [key: string]: CacheEntry } = {};

export const cacheUtils = {
    /**
     * Retrieves data from cache or executes the provider function if not found or stale.
     */
    get: function<T>(key: string, provider: () => T, timeout: number = DEFAULT_TIMEOUT): T {
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
     * Caches room.find operations.
     * Use predefined keys for common searches to avoid expensive filter.toString()
     */
    findInRoom: function<T extends FindConstant>(room: Room, type: T, filter?: (obj: any) => boolean, timeout: number = 10): any[] {
        // Create a unique key based on room name, type and a hash of the filter if possible, 
        // but for high-frequency ones we use specific timeouts.
        const key = `find_${room.name}_${type}`;
        
        // If it's a permanent object, use long timeout
        let effectiveTimeout = timeout;
        if (type === FIND_SOURCES || type === FIND_MINERALS) {
            effectiveTimeout = LONG_TIMEOUT;
        } else if (type === FIND_HOSTILE_CREEPS || type === FIND_MY_STRUCTURES || type === FIND_CONSTRUCTION_SITES) {
            // These change often, but can be cached for at least 1 tick to save CPU within the same loop
            effectiveTimeout = Math.max(timeout, TICK_TIMEOUT);
        }

        // Note: Filters are tricky to cache globally. 
        // If a filter is provided, we append its string representation but use a shorter timeout.
        const finalKey = filter ? `${key}_${filter.toString().length}_${effectiveTimeout}` : key;

        return this.get(finalKey, () => room.find(type, filter ? { filter } : undefined), effectiveTimeout);
    },

    /**
     * Specialized cache for permanent room objects
     */
    getSources: function(room: Room): Source[] {
        return this.findInRoom(room, FIND_SOURCES);
    },

    getStructures: function(room: Room): Structure[] {
        return this.findInRoom(room, FIND_STRUCTURES, undefined, 5);
    },

    getMyStructures: function(room: Room): AnyOwnedStructure[] {
        return this.findInRoom(room, FIND_MY_STRUCTURES, undefined, 5);
    },

    getHostiles: function(room: Room): Creep[] {
        return this.findInRoom(room, FIND_HOSTILE_CREEPS, undefined, 1);
    },

    invalidate: function(key: string): void {
        delete globalCache[key];
    },

    clearTickCache: function(): void {
        const now = Game.time;
        for (const key in globalCache) {
            if (now - globalCache[key].timestamp > 1000) {
                delete globalCache[key]; // Clean very old entries
            }
        }
    }
};

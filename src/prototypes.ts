/// <reference path="./declarations.d.ts" />
import _ from 'lodash';
import { OBSTACLE_OBJECT_TYPES } from './constants'; // Importa a constante

RoomPosition.prototype.isWalkable = function(creepLooking?: Creep): boolean {
    const terrain = this.lookFor(LOOK_TERRAIN)[0];
    if (terrain === 'wall') return false;

    const structures = this.lookFor(LOOK_STRUCTURES);
    if (_.some(structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType) && (!('my' in s) || !(s as OwnedStructure).my))) {
        return false;
    }

    const constructionSites = this.lookFor(LOOK_CONSTRUCTION_SITES);
    if (_.some(constructionSites, (cs) => OBSTACLE_OBJECT_TYPES.includes(cs.structureType) && (!('my' in cs) || !(cs as any).my))) {
        return false;
    }
    
    const creeps = this.lookFor(LOOK_CREEPS);
    if (creeps.length > 0 && (!creepLooking || creeps[0].id !== creepLooking.id)) { 
        return false;
    }

    return true;
};

RoomPosition.prototype.getAdjacentPositions = function(): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = this.x + dx;
            const y = this.y + dy;
            if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
                positions.push(new RoomPosition(x, y, this.roomName));
            }
        }
    }
    return positions;
};

RoomPosition.prototype.hasCreep = function(): boolean {
    return this.lookFor(LOOK_CREEPS).length > 0;
};

// Helper function to find an adjacent walkable spot for a given RoomPosition
RoomPosition.prototype.findAdjacentWalkableSpot = function(this: RoomPosition): RoomPosition | null {
    const room = Game.rooms[this.roomName];
    if (!room) return null;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Skip the center position

            const x = this.x + dx;
            const y = this.y + dy;

            // Check if within room bounds
            if (x < 0 || x > 49 || y < 0 || y > 49) continue;

            const pos = new RoomPosition(x, y, this.roomName);

            // Check if terrain is walkable
            if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

            // Check for existing structures that block movement/construction
            const structures = pos.lookFor(LOOK_STRUCTURES);
            if (_.some(structures, (s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType))) {
                continue;
            }

            // Check for existing construction sites that block movement/construction
            const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            if (_.some(constructionSites, (cs) => OBSTACLE_OBJECT_TYPES.includes(cs.structureType))) {
                continue;
            }

            return pos; // Found a walkable and empty spot
        }
    }
    return null; // No walkable spot found
};

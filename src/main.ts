import RoomScanner from "./rooms/room.scanner";
import RoomPlanner from "./rooms/room.planner";
import SpawnLogic from "./spawns/spawn.logic";
import ToolPixel from "./tools/tool.pixel";
import RoleHarvester from "./roles/role.harvester";
import RoleSupplier from "./roles/role.supplier";
import RoleUpgrader from "./roles/role.upgrader";
import RoleWorker from "./roles/role.worker";

export const loop = () => {
  // Clear dead creep memory
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  // Run Room Scanner
  RoomScanner.run();

  // PURIFICATION PROTOCOL: Destroy EVERYTHING not planned (high frequency)
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller && room.controller.my) {
      // 1. Destroy all construction sites
      const sites = room.find(FIND_CONSTRUCTION_SITES);
      for (const site of sites) site.remove();

      // 2. Destroy all structures except Spawn/Controller
      const structures = room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType !== STRUCTURE_SPAWN && s.structureType !== STRUCTURE_CONTROLLER
      });
      for (const s of structures) {
        console.log(`[Purification] Annhilating ${s.structureType} at ${s.pos}`);
        s.destroy();
      }
    }
  }

  // ALL OTHER SYSTEMS SUSPENDED
  // RoomPlanner.run();
  // SpawnLogic.run();
  // ToolPixel.run();
...
  // Run Creeps
  /* for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === 'harvester') RoleHarvester.run(creep);
    if (creep.memory.role === 'supplier') RoleSupplier.run(creep);
    if (creep.memory.role === 'upgrader') RoleUpgrader.run(creep);
    if (creep.memory.role === 'worker') RoleWorker.run(creep);
  } */

  // No CPU logs to keep the console clean
};

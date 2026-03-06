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

  // Run Room Planner
  RoomPlanner.run();

  // Run Spawner
  SpawnLogic.run();

  // Run Pixel Generator
  ToolPixel.run();

  // Run Creeps
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === 'harvester') RoleHarvester.run(creep);
    if (creep.memory.role === 'supplier') RoleSupplier.run(creep);
    if (creep.memory.role === 'upgrader') RoleUpgrader.run(creep);
    if (creep.memory.role === 'worker') RoleWorker.run(creep);
  }

  // No CPU logs to keep the console clean
};

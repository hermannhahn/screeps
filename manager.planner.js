/**
 * Manager: Construction Planner
 * Responsabilidade: Planejar e colocar Construction Sites automaticamente.
 */
const managerPlanner = {
  /** @param {Room} room **/
  run: function(room) {
    // Só executa o planejamento se não houver muitos canteiros de obras ativos (limite de 5 para não sobrecarregar)
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length > 5) return;

    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) return;

    const spawn = spawns[0];
    
    // BLUEPRINT 1: Ruas em volta do Spawn (Distância 2 para manter 1 bloco de folga)
    this.planRoadRing(room, spawn.pos, 2);
  },

  /** 
   * Cria um anel de estradas em volta de uma posição
   * @param {Room} room 
   * @param {RoomPosition} centerPos 
   * @param {number} distance 
   */
  planRoadRing: function(room, centerPos, distance) {
    for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
      for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
        // Apenas o perímetro do quadrado
        if (x === centerPos.x - distance || x === centerPos.x + distance ||
            y === centerPos.y - distance || y === centerPos.y + distance) {
          
          const pos = new RoomPosition(x, y, room.name);
          
          // Verifica se o terreno é passável (não é parede)
          const terrain = room.getTerrain().get(x, y);
          if (terrain === TERRAIN_MASK_WALL) continue;

          // Verifica se já existe construção ou estrutura ali
          const look = pos.look();
          const hasStructure = look.some(obj => obj.type === 'structure' || obj.type === 'constructionSite');
          
          if (!hasStructure) {
            room.createConstructionSite(x, y, STRUCTURE_ROAD);
          }
        }
      }
    }
  }
};

module.exports = managerPlanner;

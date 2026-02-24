# Blueprint: Roads (Estradas)

Existem múltiplos blueprints de estradas: `spawnRoads`, `sourceRoads`, `controllerRoads`, `mineralRoads`.

## Lógica Geral
- **Objetivo:** Conectar pontos de interesse (Spawn, Sources, Controller) para acelerar o movimento dos creeps e reduzir o custo de CPU de pathfinding.
- **Planejamento:** Utiliza algoritmos de busca de caminho para traçar a rota mais eficiente entre dois pontos e coloca sites de `STRUCTURE_ROAD` ao longo do caminho.

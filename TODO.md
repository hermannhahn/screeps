# TODO List para Screeps Bot

Este documento lista melhorias e tarefas pendentes para o Screeps Bot.

## Prioridade Alta

- [ ] **Planner 2.0:**
    - [ ] Implementar a lógica de planejamento para Extensões (Extensions) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Containers de Fonte (Source Containers) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Torres (Towers) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Storage em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Links em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Ramparts e Walls em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Estradas de Controller (Controller Roads) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Estradas de Fonte (Source Roads) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Estradas de Saída (Exit Roads) em `manager.layoutGenerator.ts`.
    - [ ] Implementar a lógica de planejamento para Estradas de Mineral (Mineral Roads) em `manager.layoutGenerator.ts`.
    - [ ] Adicionar lógica de `room.visual` ao planner para desenhar os planos na tela.

## Melhorias em Corpos de Creeps (manager.spawner.ts)

- [ ] **`getUpgraderBody`:** Refinar para RCLs altos (muitos WORK, mínimo CARRY/MOVE para upgraders estáticos com links).
- [ ] **`getRemoteHarvesterBody`:** Otimizar proporção CARRY/MOVE para velocidade (mais MOVE).
- [ ] **`getCarrierBody`:** Otimizar proporção CARRY/MOVE para `2 CARRY : 1 MOVE` para eficiência em estradas.
- [ ] **`getReserverBody`:** Focar em 1 CLAIM e maximizar MOVE.

## Melhorias em Contagens de População (manager.spawner.ts)

- [ ] **`targetSuppliers`:** Ajustar contagem de suppliers com base na distância das fontes e presença de links.
- [ ] **`targetBuilders`:** Escalar contagem de builders se houver muitos `ConstructionSites` pendentes.

## Outras Melhorias

- [ ] Refinar a detecção de ataque no `manager.spawner.ts` e `manager.planner.ts` para ignorar creeps hostis que não possuem partes de ataque (scouts).
- [ ] Implementar gestão de pixels mais inteligente no `main.ts` (não gerar pixels se o bucket estiver baixo, etc.).
- [ ] Remover ou comentar os `console.log` de depuração após a fase de desenvolvimento.

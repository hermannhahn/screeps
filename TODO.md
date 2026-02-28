# TODO List - Screeps Project

## 🚀 Fase 1: Planejamento Inicial e Estruturas Essenciais (RCL 1)

### 🏗️ Planejamento de Estruturas (`manager.planner.ts`)
- [ ] **Implementar:** Estrutura base do módulo `manager.planner.ts`.
- [ ] **Definir:** Estruturas de dados para armazenar o plano de construção (ex: `PlannedStructure` interface com `pos`, `structureType`, `status`).
- [ ] **Lógica:** Implementar a função inicial `planStructures()` que será chamada em `main.ts`.
- [ ] **Prioridades (RCL 1):**
    - [ ] Identificar e gerenciar o Spawn existente.
    - [ ] Para cada Source: planejar 1 Container e 1 Link a no máximo 3 blocos de distância (idealmente a 1 bloco).
    - [ ] Planejar 1 Container próximo ao Controller.
    - [ ] Planejar 1 Container próximo às Torres (se existirem ou para o futuro).
    - [ ] Planejar a construção de Extensões (`STRUCTURE_EXTENSION`) para aumentar a capacidade de spawn.
    - [ ] Planejar Estradas (`STRUCTURE_ROAD`) para conectar spawn, containers, links e áreas de coleta/upgrade.
- [ ] **Persistência:** Implementar o salvamento do plano de construções na memória (`Memory.planning`).

### 🧠 Gerenciamento de Memória e Reconstrução
- [ ] **Salvar Plano:** Garantir que o plano de construção seja salvo de forma persistente na memória do jogo.
- [ ] **Carregar Plano:** Implementar a lógica para carregar o plano da memória ao iniciar o tick (`main.ts` ou um módulo dedicado).
- [ ] **Identificar Destruição:** Desenvolver uma rotina para verificar periodicamente se as estruturas planejadas ainda existem.
- [ ] **Replanejar/Reconstruir:** Se uma estrutura planejada for destruída, marcar como `NEEDS_REBUILD` e iniciar o processo de reconstrução através do spawn.

### ⚙️ Integração com `main.ts`
- [ ] **Chamar Planner:** Garantir que `manager.planner.ts` seja chamado no loop principal (`main.ts`) para gerar e gerenciar planos.
- [ ] **Chamada de Spawn:** Integrar a lógica de construção do spawn para que ele possa construir as estruturas planejadas.

## 🛠️ Fase 2: Creeps Essenciais (Harvester, Supplier)
- [ ] **Definir Roles:** Criar `role.harvester.ts` e `role.supplier.ts`.
- [ ] **Lógica de Harvester:** Coletar energia da fonte. Prioridade de depósito:
    - [ ] Se não houver suppliers vivos: Depositar no Spawn, depois Extensions.
    - [ ] Se houver suppliers vivos: Prioridade 1 - Link (inRange 3), Prioridade 2 - Container (inRange 3), Prioridade 3 - Drop.
- [ ] **Lógica de Supplier:** Transportar energia. Distinguir pontos de coleta (Containers/Links a até 3 blocos de Sources) e pontos de entrega (demais Containers, Spawn, Extensions, Controller).
- [ ] **Gerenciamento de Spawns:** Implementar `manager.spawns.ts` para gerenciar a criação desses creeps.

## 🧰 Ferramentas e Utilitários (`tools.ts`)
- [ ] **Funções Auxiliares:** Criar ou refatorar funções úteis em `src/tools.ts`.

## 🎯 Próximos Passos
- [ ] Implementar a lógica de coleta de energia (`role.harvester`).
- [ ] Implementar a lógica de transporte de energia (`role.supplier`).
- [ ] Refinar o planner para suportar mais tipos de construções.

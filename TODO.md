# TODO List - Screeps Project

## Fase 1 (Concluída ✅)

### Preparação Inicial
- [x] **Rooms**: Criar scanner de sala para armazenar na memória informações pertinentes.
- [x] **Creeps**: Lógicas gerais aplicadas a todos os creeps.
- [x] **Roles**: Criar roles iniciais: Harvester, Supplier, Upgrader e Worker (Para reparar e construir).
- [x] **Spawner**: Criar arquivos iniciais do spawner.
- [x] **Planner**: Planejador e criador de Construction Sites.

## Fase 2 (Em Progresso 🚀)

### Logística e Infraestrutura
- [x] **Mineração Estática**: Refatorar Harvesters para minerar e dropar (concluído inicialmente).
- [x] **Supplier**: Refatorar lógica de distribuição com sistema de prioridades e fallbacks (concluído inicialmente).
- [x] **Upgrader**: Refatorar lógica de upgrade com sistema de coleta e fallbacks (concluído inicialmente).
- [ ] **Containers**: Adicionar lógica para o Planner construir containers em fontes e no controller.
- [ ] **Towers**: Implementar a lógica inicial de torres para defesa e reparos básicos.
- [ ] **Estruturas de Estrada**: Adicionar lógica ao Planner para criar estradas entre pontos de interesse (Spawn -> Sources -> Controller).

## Fase 3 (Planejada)

### Expansão e Defesa
- [ ] **Scout**: Criar creep de exploração para mapear salas vizinhas.
- [ ] **Defesa Ativa**: Criar roles de combate básico (Guard/Archer) baseadas na ameaça da sala.
- [ ] **Mineração Remota**: Estender a economia para salas adjacentes.

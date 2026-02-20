# Screeps Bot - Estrutura Inicial (Avançada)

Este repositório contém um script robusto e escalável para o jogo **Screeps**, focado em automação eficiente e auto-suficiência. Ele foi projetado para otimizar o uso de recursos e o progresso da sala.

## 🚀 Visão Geral das Funcionalidades

### 1. Autogestão de População (`main.js`)
O script agora analisa o estado da sala para decidir quantos creeps criar, com otimização contínua:
- **Spawn Inteligente:** Creeps são spawnados *antes* da morte de seus predecessores, minimizando o tempo de inatividade. O cálculo considera o tempo de spawn do creep e, para roles estáticas (Harvesters, Upgraders), o tempo de viagem até o ponto de trabalho.
- **Harvesters Dedicados:** Exatamente **1 Harvester por fonte** de energia.
- **Suppliers Reforçados:** **2 Suppliers por fonte** de energia, garantindo uma logística eficiente.
- **Upgraders Adaptáveis:**
  - Segue a fórmula `Math.max(1, 4 - RCL)`.
  - Prioriza a evolução do controlador, com um limite mínimo de 1 upgrader.
- **Builders Focados:** Máximo de **1 Builder** ativo, otimizando a construção.
- **Detecção de Creeps Presos:** Creeps que ficam presos nas bordas da sala são detectados, têm suas tarefas resetadas e são forçados a retornar ao spawn.

### 2. Roles (Papéis)

#### 🔋 Harvester (`role.harvester.js`)
- **Objetivo:** Mineração otimizada e estática.
- **Comportamento Inteligente:**
  - **Com Logística (Suppliers vivos):**
    1. Procura um **Container** em um raio de 2 blocos da fonte para depositar a energia.
    2. Se não houver container, **dropa a energia no chão** (`drop`) para que os Suppliers a coletem. Isso maximiza o tempo de mineração ativa.
  - **Modo de Emergência (Sem Suppliers vivos):**
    - Assume o papel de transporte, levando a energia pessoalmente até o **Spawn** e **Extensions** para evitar que a sala fique sem energia.

#### 🚚 Supplier (`role.supplier.js`)
- **Objetivo:** Transporte e logística de energia.
- **Lógica de Entrega Otimizada:**
  - **Prioridade 1:** Abastece **Spawns** e **Extensions** com capacidade livre.
  - **Prioridade 2:** Abastece **Upgraders** e **Builders** que estejam completamente sem energia (`store[RESOURCE_ENERGY] === 0`) e que *não* estejam sendo atendidos por outro Supplier. Suppliers se atribuem a um creep, evitando duplicação de esforço.
  - **Prioridade 3:** Abastece **Towers** com capacidade livre.
  - **Fallback Produtivo:** Se não houver alvos de transferência:
    1. Prioriza **construir** canteiros de obras (priorizando o mais avançado e depois o mais próximo, via `task.build.js`).
    2. Se não houver construção, ajuda no **upgrade do controlador**.
- **Coleta de Energia:** Coleta energia do chão (`dropped`) ou de containers/storage próximos às fontes.

#### 🚧 Builder (`role.builder.js`)
- **Objetivo:** Construção de estruturas.
- **Lógica de Coleta Inteligente:** Utiliza um módulo centralizado (`task.collectEnergy.js`) para buscar energia com a seguinte prioridade:
  1. De um **Supplier** que o marcou como alvo (`creep.memory.assignedSupplier`). O Builder move-se ativamente em direção ao Supplier.
  2. De **energia dropada** com a maior quantidade na sala.
  3. De **Containers** próximos às fontes (até 3 blocos).
  4. Do **Storage** da sala.
- **Lógica de Construção Otimizada:** Utiliza um módulo centralizado (`task.build.js`) para:
  - Priorizar o canteiro de obras **mais avançado** (maior `progress / progressTotal`).
  - Em caso de empate, prioriza o canteiro de obras **mais próximo**.
  - Se não houver nada para construir, ajuda no upgrade do controlador.

#### ⬆️ Upgrader (`role.upgrader.js`)
- **Objetivo:** Aumentar o nível da sala (GCL/RCL).
- **Lógica de Coleta Inteligente:** Compartilha a mesma lógica de coleta inteligente do Builder (`task.collectEnergy.js`), buscando energia nas prioridades listadas acima.
- **Comportamento:** Utiliza a energia para o `upgradeController`, essencial para o progresso da sala.

## 🏗️ Planejamento de Construções (`manager.planner.js`)
Este módulo planeja automaticamente a construção de estruturas em fases (`Blueprints`), otimizando o layout da sala e minimizando o consumo de CPU:
- **Verificação Periódica:** Executa a cada 100 ticks (`Game.time % 100 !== 0`).
- **Verificação de Ataque:** Suspende o planejamento se a sala estiver sob ataque (`FIND_HOSTILE_CREEPS`).
- **Limite de CS:** Não cria mais de 5 canteiros de obras ativos para evitar sobrecarga.
- **Estágios de Blueprint (`room.memory.blueprintStage`):**
  - **Blueprint 0: `Spawn Roads`**
    - Cria um anel de estradas ao redor do spawn.
  - **Blueprint 1: `Extensions`**
    - Cria as 5 primeiras extensões, garantindo que estejam a pelo menos 3 blocos de distância do spawn.
  - **Blueprint 2: `Source Roads`**
    - Conecta cada fonte de energia à estrada mais próxima ao redor do spawn.
  - **Blueprint 3: `Controller Roads`**
    - Conecta o controlador da sala à estrada mais próxima.
  - **Blueprint 4: `Mineral Roads`**
    - Conecta cada depósito de mineral à estrada mais próxima.
- **Logging Aprimorado:** Mensagens de console indicam o blueprint *atual* sendo planejado e o *próximo* estágio após a conclusão.

## 📁 Estrutura de Arquivos
- `main.js`: Loop principal, lógica de spawn e detecção de creeps presos.
- `role.harvester.js`: Lógica do Harvester.
- `role.upgrader.js`: Lógica do Upgrader.
- `role.supplier.js`: Lógica do Supplier.
- `role.builder.js`: Lógica do Builder.
- `manager.planner.js`: Lógica de planejamento de construções em estágios.
- `task.collectEnergy.js`: Módulo com a lógica centralizada de coleta de energia (usado por Builder e Upgrader).
- `task.build.js`: Módulo com a lógica centralizada de construção (usado por Builder e Supplier).

---
*Dica: Certifique-se de que o nome do seu spawner no jogo é `Spawn1`, caso contrário, ajuste a linha `room.find(FIND_MY_SPAWNS)[0]` no `main.js`.*

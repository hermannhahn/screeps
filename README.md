# Screeps Bot - Estrutura Inicial

Este repositório contém um script básico e escalável para o jogo **Screeps**. Ele foi projetado para crescer junto com sua sala, adaptando automaticamente o poder dos creeps conforme você constrói extensões de energia.

## 🚀 Como Funciona

### 1. Módulo Principal (`main.js`)
O coração do script gerencia:
- **Limpeza de Memória:** Remove dados de creeps mortos para economizar CPU.
- **Spawner Inteligente:** Calcula dinamicamente o corpo (body parts) dos creeps com base na energia total da sala (`energyCapacityAvailable`).
  - **Lógica de Emergência:** Se você não tiver nenhum Harvester, o spawner cria um básico com a energia atual disponível para evitar o colapso da sala.
  - **Escalabilidade:** Conforme você adiciona **Extensions**, os novos creeps serão criados com mais partes de `WORK`, `CARRY` e `MOVE`, tornando-os muito mais eficientes.
- **Loop de Execução:** Itera sobre todos os creeps e delega a lógica para suas respectivas roles.

### 2. Roles (Papéis)

#### 🔋 Harvester (`role.harvester.js`)
- **Objetivo:** Manter a sala energizada.
- **Prioridade:** 
  1. Abastecer o **Spawn1**.
  2. Abastecer as **Extensions**.
  3. Abastecer **Towers** (se existirem).
  4. Se tudo estiver cheio, ele ajudará no upgrade do Controller.

#### ⬆️ Upgrader (`role.upgrader.js`)
- **Objetivo:** Aumentar o nível da sala (GCL/RCL).
- **Lógica:** Coleta energia das fontes e a utiliza exclusivamente para o `upgradeController`. É essencial para desbloquear novas estruturas e expandir o limite de CPU.

## 🛠️ Configurações Recomendadas

No arquivo `main.js`, você pode ajustar a população desejada alterando as constantes:
- `MIN_HARVESTERS`: Quantidade mínima de mineradores para manter a base viva.
- `MIN_UPGRADERS`: Quantidade de upgraders para focar no crescimento da sala.

## 📦 Estrutura de Arquivos
- `main.js`: Loop principal e lógica de spawn.
- `role.harvester.js`: Lógica de coleta e entrega de energia.
- `role.upgrader.js`: Lógica de evolução do controlador.

---
*Dica: Certifique-se de que o nome do seu spawner no jogo é `Spawn1`, caso contrário, ajuste a linha `Game.spawns['Spawn1']` no `main.js`.*

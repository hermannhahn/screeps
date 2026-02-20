# Screeps Bot - Estrutura Inicial

Este repositório contém um script básico e escalável para o jogo **Screeps**. Ele foi projetado para crescer junto com sua sala, adaptando automaticamente o poder dos creeps conforme você constrói extensões de energia.

## 🚀 Como Funciona

### 1. Autogestão de População (`main.js`)
O script agora analisa o estado da sala para decidir quantos creeps criar:
- **Harvesters Dinâmicos:**
  - Nível baixo (RCL < 3): Mantém 2 creeps por fonte de energia para garantir fluxo constante.
  - Nível alto (RCL >= 3): Reduz para 1 creep por fonte, pois os corpos maiores (`WORK` parts extras) são mais eficientes e economizam CPU.
- **Upgraders Adaptáveis:**
  - Prioriza o crescimento inicial (até 6 upgraders no RCL 1).
  - Escala conforme a reserva: Se a sala estiver com energia no limite máximo (`energyAvailable == energyCapacity`), o script cria **Upgraders extras** automaticamente para acelerar o progresso global.
- **Prioridade de Sobrevivência:** A criação de Upgraders é interrompida se o número de Harvesters estiver abaixo da meta, garantindo que a base nunca fique sem energia.

### 2. Roles (Papéis)

#### 🔋 Harvester (`role.harvester.js`)
- **Objetivo:** Mineração de fontes.
- **Nova Cadeia de Logística (Prioridades):**
  1. **Container:** Se houver um Supplier vivo, deposita no container mais próximo da fonte.
  2. **Transferência Direta:** Entrega para o `Supplier` mais próximo.
  3. **Abastecimento Direto:** Se a logística falhar, abastece o Spawn/Extensions manualmente.

#### 🚚 Supplier (`role.supplier.js`) - **NOVO**
- **Objetivo:** Transporte e logística de energia.
- **Lógica:**
  - Coleta energia caídano chão ou de containers em um raio de 3 blocos das fontes.
  - Abastece prioritariamente o **Spawn**, **Extensions** e **Towers**.
  - Garante que os Harvesters não precisem sair de perto das fontes, maximizando a produção.

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

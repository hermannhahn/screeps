# Manager Planner

O `Manager Planner` é o orquestrador central que decide quais estruturas devem ser construídas e quando, baseado no progresso da sala. Ele opera em uma revisão estritamente sequencial para garantir que a infraestrutura básica seja mantida antes de avançar para novas expansões.

## Logic Flow (English)

- If current tick % 20 is not 0: **Exit** (Throttle)
- Find hostile creeps in room
- Find damaged structures
- If hostile creeps > 0 AND damaged structures > 0:
    - Log: "Room under attack, suspending planning"
    - **Exit**
- Define `BLUEPRINTS_ORDER`: Sequential list of blueprints:
    1.  **Spawn Roads:** Estradas circulares ao redor do spawn.
    2.  **Extensions:** Todas as extensões possíveis para o RCL atual.
    3.  **First Tower:** Primeira torre de defesa (RCL 3+).
    4.  **Storage:** Armazenamento central (RCL 4+).
    5.  **Source Containers:** Containers nas fontes para mineração estática.
    6.  **Controller Container:** Container adjacente ao Controller para upgrade eficiente.
    7.  **Second Tower:** Segunda torre de defesa (RCL 5+).
    8.  **Source Roads:** Estradas ligando fontes ao spawn/logística.
    9.  **Controller Roads:** Estradas ligando o Controller à logística.
    10. **Links:** Rede de transferência instantânea de energia (RCL 5+).
    11. **Ramparts & Walls:** Defesas passivas.
    12. **Mineral Roads:** Estradas para minerais (RCL 6+).
- Find total construction sites in room
- **Sequential Review Loop** (Iterate through `BLUEPRINTS_ORDER` from index 0):
    - Let `currentBlueprint = BLUEPRINTS_ORDER[i]`
    - **Step A: Check Completion**
        - If `currentBlueprint.isComplete(room, spawn)`:
            - This checks if structures are built OR already planned (CS exists).
            - **Continue** to next stage.
    - **Step B: Plan Incomplete Stage**
        - If room has more than 20 construction sites: **Break Loop** (Wait for builders to clear some sites).
        - Try `sitesCreated = currentBlueprint.plan(room, spawn)`
        - If `sitesCreated > 0`:
            - Log: "Planned X sites for stage i"
            - **Break Loop** (Stop review to ensure sequential integrity and avoid flooding).
        - Else:
            - The stage is incomplete but could not be planned (ex: RCL insuficiente, área insegura).
            - **Continue** (O planner pula este estágio e tenta o próximo, evitando que um estágio bloqueado impeça a expansão do RCL).

## Principais Mudanças Recentes
- **Pular Estágios (Continue):** Se um estágio for detectado como incompleto mas não puder ser planejado (ex: minerais no RCL 5), o planner agora pula para o próximo estágio. Isso evita o "Sequential Stop" que impedia construções de RCL alto se algo do RCL baixo estivesse bloqueado.
- **Reordenação de Prioridades:** Extensões, Torres e Storage agora são priorizados antes de estradas e logística secundária.
- **RCL 5 Readiness:** Adicionado suporte para Storage, Links e a segunda Torre.
- **Limite de Sites (20):** Mantido para evitar sobrecarga de construção.

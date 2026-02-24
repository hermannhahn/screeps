# Manager Planner

O `Manager Planner` é o orquestrador central que decide quais estruturas devem ser construídas e quando, baseado no progresso da sala. Ele opera em uma revisão estritamente sequencial para garantir que a infraestrutura básica seja mantida antes de avançar para novas expansões.

## Logic Flow (English)

- If current tick % 20 is not 0: **Exit** (Throttle)
- Find hostile creeps in room
- Find damaged structures
- If hostile creeps > 0 AND damaged structures > 0:
    - Log: "Room under attack, suspending planning"
    - **Exit**
- Define `BLUEPRINTS_ORDER`: Sequential list of blueprints (Spawn Roads -> Extensions -> Source Containers -> etc.)
- Find total construction sites in room
- **Sequential Review Loop** (Iterate through `BLUEPRINTS_ORDER` from index 0):
    - Let `currentBlueprint = BLUEPRINTS_ORDER[i]`
    - **Step A: Check Completion**
        - If `currentBlueprint.isComplete(room, spawn)`:
            - This checks if structures are built OR already planned (CS exists).
            - It also checks **RCL requirements**. If RCL is too low, it's considered "Complete/Not Applicable" to allow the loop to proceed.
            - **Continue** to next stage.
    - **Step B: Plan Incomplete Stage**
        - If room has more than 20 construction sites: **Break Loop** (Sequential Stop - wait for builders to clear some sites).
        - Try `sitesCreated = currentBlueprint.plan(room, spawn)`
        - If `sitesCreated > 0`:
            - Log: "Planned X sites for stage i"
            - **Break Loop** (Stop review to ensure sequential integrity and avoid flooding).
        - Else:
            - The stage is incomplete but couldn't be planned (e.g. unsafe conditions or no valid spots).
            - **Break Loop** (Sequential Stop - do not plan later stages if a prior priority is missing and cannot be placed).

## Principais Mudanças Recentes
- **Revisão Sequencial Estrita:** O planner agora sempre começa do Estágio 0. Se um container de fonte (Estágio 5) for destruído, ele será detectado e replanejado antes de qualquer nova extensão ser colocada.
- **Limite de Sites (20):** Permite que o planner continue revisando a sala mesmo que existam construções em andamento, desde que o número de obras não ultrapasse 20.
- **Frequência (20 ticks):** Resposta muito mais rápida a danos ou mudanças no RCL.

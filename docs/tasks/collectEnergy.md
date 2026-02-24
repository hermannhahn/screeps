# Task: Collect Energy

Módulo universal para coleta de energia, usado por todas as roles civis. Implementa um sistema de reservas reais para evitar que múltiplos creeps se desloquem para o mesmo recurso escasso.

## Sistema de Reservas (Energy Accounting)

Para cada alvo potencial, o creep calcula a **Energia Real Disponível**:
`Disponível = Quantidade Total - Energia já reservada por outros creeps`

A energia reservada é a soma da capacidade livre (`store.getFreeCapacity`) de todos os creeps que já têm aquele `targetEnergyId` em sua memória. Isso garante que, se um container tem 50 de energia e um creep já está indo buscar, o próximo creep verá 0 disponível e buscará outro alvo.

## Pontuação por Eficiência (Scoring)

Quando múltiplos alvos têm energia disponível, o creep escolhe o melhor baseado em:
`Score = (Disponível^2) / Distância`

Isso prioriza fortemente grandes acúmulos de energia (como drops de morte), mas penaliza a distância para evitar viagens ineficientes.

## Prioridades de Coleta

1.  **Energia Dropada:** Recursos no chão (evita desperdício por decay).
2.  **Source Containers:** Containers posicionados ao lado das fontes de energia.
3.  **Storage:** Armazenamento central da sala.
4.  **Controller Container:** Container de suporte ao Upgrader.

## Logic Flow (English)

- If `memory.assignedSupplier` exists: Move to supplier and return.
- If `memory.targetEnergyId` exists:
    - Validate if `Available Energy (Amount - Reservations + MyNeed) > 0`.
    - If <= 0: Clear `memory.targetEnergyId`.
- If no target:
    - Search Priority List (Dropped -> Containers -> Storage -> Controller Container).
    - For each category, find the target with the highest `Score`.
    - Target must have `Available Energy > 0`.
    - Set `memory.targetEnergyId`.
- If target found:
    - If `pickup/withdraw` is `ERR_NOT_IN_RANGE`: Move to target.
    - If `OK`, `ERR_FULL` or `ERR_NOT_ENOUGH`: Clear `memory.targetEnergyId`.
- Else (No energy found):
    - Idle behavior (Move towards controller).

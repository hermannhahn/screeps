# Task: Deliver Energy

Módulo responsável pela distribuição de energia na sala, priorizando estruturas críticas de sobrevivência e spawn. Assim como na coleta, utiliza um sistema de reservas para evitar redundância.

## Sistema de Reservas (Delivery Accounting)

Para evitar que múltiplos Suppliers corram para a mesma Extensão que só precisa de 50 de energia, o creep calcula o **Espaço Real Disponível**:
`Espaço Disponível = Capacidade Livre - Energia já a caminho`

A "energia já a caminho" é a soma do conteúdo (`store.getUsedCapacity`) de todos os creeps que têm essa estrutura como `deliveryTargetId`.

## Pontuação por Eficiência

Dentro de cada categoria de prioridade, o alvo é escolhido por:
`Score = Espaço Disponível / Distância`

## Prioridades de Entrega

1.  **Spawns e Extensions:** Garantia de continuidade de produção de creeps.
2.  **Towers:** Defesa e reparo emergencial (mínimo de 400 de espaço livre para aceitar entrega).
3.  **Creeps (Builders/Upgraders):** Entrega direta para manter trabalhadores ativos.
4.  **Controller Container:** Suprimento passivo para upgrades constantes.

## Logic Flow (English)

- If `memory.deliveryTargetId` exists:
    - Validate if `Available Space (Free - Incoming + MyEnergy) > 0`.
    - If <= 0: Clear `memory.deliveryTargetId`.
- If no target:
    - Search Priority List (Core -> Towers -> Creeps -> Controller Container).
    - Select target with best `Score` (Available Space / Distance).
    - Set `memory.deliveryTargetId`.
- If target found:
    - If `transfer` is `ERR_NOT_IN_RANGE`: Move to target.
    - If `OK`, `ERR_FULL` or `ERR_INVALID`: Clear `memory.deliveryTargetId`.
- Returns `true` if it has a task, `false` otherwise.

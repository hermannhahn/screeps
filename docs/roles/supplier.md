# Role: Supplier

O **Supplier** (Fornecedor/Logístico) é o transportador de recursos da sala.

## Comportamento

1.  **Coleta:**
    - Prioridade 1: Energia dropada no chão (mínimo 50 unidades).
    - Prioridade 2: Containers de fontes (Source Containers).
    - Prioridade 3: Storage.
2.  **Entrega:**
    - Prioridade 1: Spawn e Extensions (para permitir novos spawns).
    - Prioridade 2: Creeps que precisam de energia (Builders/Upgraders).
    - Prioridade 3: Torres (para defesa e reparo).
    - Prioridade 4: Controller Container (para sustentar o upgrade).

## Lógica Especial
- Evita retirar energia do `Controller Container` a menos que não haja mineradores na sala, para não desequilibrar o estoque de upgrade.

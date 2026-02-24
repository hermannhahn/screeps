# Role: Harvester

O **Harvester** (Colhedor/Minerador) é a base da economia. Sua única função é extrair energia das fontes.

## Comportamento

1.  **Mineração:** Move-se até a fonte designada (`memory.sourceId`) e extrai energia continuamente.
2.  **Entrega:**
    - Se houver `Suppliers`: Deposita em um container próximo (até 3 tiles) ou dropa no chão.
    - Se NÃO houver `Suppliers`: Entrega pessoalmente no Spawn ou Extensions.
3.  **Segurança:** Possui lógica de fuga (`flee`) se inimigos estiverem por perto.

## Estratégia
- O sistema tenta manter 1 ou 2 harvesters por fonte, dependendo do nível do Controller (RCL).

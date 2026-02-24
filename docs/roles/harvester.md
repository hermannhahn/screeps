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

## Logic Flow (English)

- Find hostile creeps in room
- Check if room has 5+ extensions
- If hostiles within range 3 AND extensions >= 5:
    - Calculate flee path using PathFinder
    - Move to flee path
    - **Exit**
- If creep has free capacity:
    - Get assigned source from `memory.sourceId`
    - If source exists:
        - If `harvest(source)` is `ERR_NOT_IN_RANGE`: Move to source
    - Else (source not assigned):
        - Find all sources in room
        - Filter "safe" sources (no hostiles within range 10)
        - Iterate safe sources:
            - Count harvesters already assigned to source
            - If assigned count < target (1 or 2):
                - Find source with minimum assigned harvesters
        - If best source found: Assign to `memory.sourceId`
        - Else (all sources full):
            - Fallback: Try `taskBuild.run()`
            - If no sites, try `taskUpgrade.run()`
- Else (creep is full):
    - Check if `Suppliers` are present in room
    - If Suppliers > 0:
        - Find containers within range 3 of assigned source
        - If container found:
            - If `transfer(energy)` is `ERR_NOT_IN_RANGE`: Move to container
        - Else:
            - `drop(energy)`
    - Else (No Suppliers):
        - Find Spawn with free capacity
        - If not found: Find Extension with free capacity
        - If target found:
            - If `transfer(energy)` is `ERR_NOT_IN_RANGE`: Move to target
        - Else:
            - `drop(energy)`

# Role: Builder

O **Builder** (Construtor) é responsável por transformar sites de construção em estruturas reais.

## Comportamento

1.  **Coleta de Energia:** Utiliza a `task.collectEnergy` para obter recursos.
2.  **Construção:** Utiliza a `task.build` para focar em sites de construção existentes.
3.  **Fallback:** Se não houver nada para construir, ajuda no upgrade do Controller.

## Logic Flow (English)

- If creep energy == 0:
    - Run `taskCollectEnergy.run()`
- Else:
    - Run `taskBuild.run()`
    - If `taskBuild` returns False (No sites):
        - Run `taskUpgrade.run()`

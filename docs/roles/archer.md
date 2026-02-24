# Role: Archer

O **Archer** (Arqueiro) é uma unidade de combate à distância projetada para defender a sala contra invasores.

## Logic Flow (English)

- Find closest hostile creep in room
- If hostile found:
    - If range > 3: Move to hostile
    - If range < 3: Move away from hostile (Kiting)
    - Always `rangedAttack(hostile)` if in range
- Else:
    - Move to "rally point" (Spawn or specific defense position)

## Requisitos de Spawn
- Só é spawnado se a sala possuir pelo menos **15 extensões** (RCL 3+).
- Priorizado quando `room.memory.isUnderAttack` é verdadeiro.

# Role: Guard

O **Guard** (Guarda) é uma unidade de combate corpo-a-corpo (Melee) para defesa da sala.

## Logic Flow (English)

- Find closest hostile creep in room
- If hostile found:
    - `attack(hostile)`
    - Move to hostile
- Else:
    - Move to rally point

## Requisitos de Spawn
- Requer pelo menos **15 extensões** para ser gerado.

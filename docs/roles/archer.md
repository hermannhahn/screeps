# Role: Archer

O **Archer** (Arqueiro) é uma unidade de combate à distância projetada para defender a sala contra invasores.

## Comportamento

1.  **Ataque:** Busca o inimigo mais próximo na sala e o ataca usando `rangedAttack`.
2.  **Kiting:** Mantém distância do alvo para evitar dano corpo-a-corpo enquanto continua disparando.
3.  **Patrulha:** Se não houver inimigos, move-se para pontos estratégicos ou permanece próximo ao Spawn/Towers.

## Requisitos de Spawn
- Só é spawnado se a sala possuir pelo menos **15 extensões** (RCL 3+).
- Priorizado quando `room.memory.isUnderAttack` é verdadeiro.

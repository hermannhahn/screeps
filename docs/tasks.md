# Tasks (Tarefas)

As `Tasks` são módulos de lógica reutilizáveis que podem ser chamados por diferentes `Roles`. Isso evita duplicação de código e mantém o comportamento consistente entre diferentes tipos de creeps.

## Lista de Tasks

### task.collectEnergy
Lógica universal para buscar energia no ambiente.
- **Prioridades de Busca:**
  1. Energia no chão (`dropped`).
  2. Controller Container (apenas para Upgraders).
  3. Containers próximos às fontes.
  4. Storage central.
  5. Controller Container (fallback para outros creeps).
- **Persistência:** O `targetEnergyId` é salvo na memória para evitar oscilação de movimento entre ticks.

### task.build
Lógica para construção de estruturas.
- **Seleção de Alvo:** Prioriza construções com maior progresso relativo (`progress / progressTotal`) para terminar obras iniciadas rapidamente.
- **Movimentação:** Move-se automaticamente até o `ConstructionSite` se estiver fora de alcance.

### task.repair
Lógica para manutenção e reparo.
- **Seleção de Alvo:** Prioriza estruturas com menos vida em relação ao máximo (`hits / hitsMax`).
- **Limites:** Geralmente configurado para ignorar muralhas/rampas em estágios iniciais ou focar em estruturas críticas.

### task.upgrade
Lógica simplificada para upgrade do Controller.
- Move-se até o Controller e executa `upgradeController`.

---

## Fluxograma de uma Task (Ex: collectEnergy)

```text
+-----------------------+
| Chamada da Task       |
+-----------+-----------+
            |
            v
+-----------------------+          +------------------------+
| Já possui um alvo     |  Sim     | O alvo ainda é válido? |
| salvo na memória?     +--------->+ (Existe e tem energia)  |
+-----------+-----------+          +-----------+------------+
            | Não                              | Sim
            v                                  v
+-----------------------+          +------------------------+
| Buscar novo alvo por  |          | Mover / Coletar        |
| prioridade            |          +------------------------+
+-----------+-----------+
            |
            v
+-----------------------+          +------------------------+
| Encontrou alvo?       |  Não     | Fallback (ex: Upgrade) |
+-----------+-----------+          +------------------------+
            | Sim
            v
+-----------------------+
| Salvar ID na memória  |
| e mover para coleta   |
+-----------------------+
```

# Roles (Papéis)

As `Roles` definem o comportamento individual de cada creep. Cada creep possui uma role atribuída em sua memória no momento do nascimento (spawn).

## Comportamento Comum: Fuga (Flee)
A maioria dos creeps civis (Harvester, Supplier, etc.) possui uma lógica de fuga automática:
- Se um inimigo estiver a menos de 3 tiles de distância.
- Se a sala tiver pelo menos 5 extensões (garantindo que não travarem a economia básica).
- O creep busca um caminho oposto ao inimigo usando `PathFinder`.

---

## Detalhes das Roles

### Harvester (Minerador)
**Missão:** Extrair energia das fontes e depositar em containers ou no chão.
- **Coleta:** Minera uma fonte específica (persistida em `memory.sourceId`).
- **Entrega:**
  - Se houver `Suppliers`: Deposita em containers próximos (até 3 tiles) ou dá `drop` no chão.
  - Se NÃO houver `Suppliers`: Entrega diretamente no Spawn e Extensions.
- **Fallback:** Se todas as fontes estiverem cheias de mineradores, ajuda a construir ou dar upgrade.

### Supplier (Logístico)
**Missão:** Transportar energia de containers/chão para as estruturas que precisam.
- **Estado:** Alterna entre `collecting` (coletando) e `delivering` (entregando).
- **Coleta:** Prioriza energia caída (dropped) > containers de fontes > storage.
- **Entrega:** Prioriza Spawn > Extensions > Creeps (Upgraders/Builders vazios) > Towers > Controller Container.

### Upgrader
**Missão:** Aumentar o nível de controle da sala (RCL) fornecendo energia ao Controller.
- **Coleta:** Prioriza Links > Controller Container > Storage > Dropped Energy.
- **Ação:** Executa continuamente `upgradeController`.

### Builder
**Missão:** Construir as estruturas planejadas pelo Planner.
- **Coleta:** Usa `taskCollectEnergy`.
- **Ação:** Usa `taskBuild` para focar nos sites de construção.

### Repairer
**Missão:** Manter a integridade das estruturas.
- **Ação:** Usa `taskRepair` para consertar estruturas com vida baixa, priorizando as mais danificadas.

### Guard & Archer (Militares)
**Missão:** Defender a sala contra invasores.
- **Guard:** Ataca corpo-a-corpo (Melee).
- **Archer:** Ataca à distância (Ranged).

---

## Fluxograma de Estado (Típico: Coletor -> Entregador)

```text
+-----------------------+
|  Creep Vazio          |
+-----------+-----------+
            |
            v
+-----------------------+
| Procurar Energia      | <-------+
| (Dropped/Container)   |         |
+-----------+-----------+         |
            |                     |
            v                     |
+-----------------------+         |
| Mover até o Alvo      |         |
+-----------+-----------+         |
            |                     |
            v                     |
+-----------------------+         |
| Está Cheio?           |  Não ---+
+-----------+-----------+
            | Sim
            v
+-----------------------+
| Procurar Destino      | <-------+
| (Spawn/Extension/etc) |         |
+-----------+-----------+         |
            |                     |
            v                     |
+-----------------------+         |
| Transferir Energia    |         |
+-----------+-----------+         |
            |                     |
            v                     |
+-----------------------+         |
| Está Vazio?           |  Não ---+
+-----------+-----------+
            | Sim
            v
+-----------------------+
| Repetir Ciclo         |
+-----------------------+
```

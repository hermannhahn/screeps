# Manager Planner

O `Manager Planner` é o cérebro estratégico responsável por planejar o layout da sala em estágios (blueprints). Ele decide onde colocar construções baseando-se no nível de controle (RCL) e na segurança da sala.

## Lógica de Execução

O planner não roda em todo tick para economizar CPU (roda a cada 100 ticks). Ele interrompe o planejamento se a sala estiver sob ataque ativo.

### Fluxograma de Decisão

```text
+-----------------------+
| Início (Tick % 100)   |
+-----------+-----------+
            |
            v
+-----------------------+          +------------------------+
| Está sob ataque?      |  Sim     | Suspende Planejamento  |
| (Inimigos + Danos)    +--------->+ e encerra              |
+-----------+-----------+          +------------------------+
            | Não
            v
+-----------------------+          +------------------------+
| Há sites de           |  Sim     | Aguarda conclusão das  |
| construção ativos?    +--------->+ obras atuais           |
+-----------+-----------+          +------------------------+
            | Não
            v
+-----------------------+
| Iterar Blueprints     |
| (BLUEPRINTS_ORDER)    |
+-----------+-----------+
            |
            v
+-----------------------+          +------------------------+
| O estágio está        |  Sim     | Pula para o próximo    |
| completo?             +--------->+ estágio                |
+-----------+-----------+          +------------------------+
            | Não
            v
+-----------------------+          +------------------------+
| Tenta planejar        |  Sucesso | Salva estágio na Mem   |
| (Criar sites)         +--------->+ e encerra loop         |
+-----------+-----------+          +------------------------+
            | Falha
            v
+-----------------------+
| Tenta próximo estágio |
+-----------------------+
```

## Ordem de Blueprints (BLUEPRINTS_ORDER)

As estruturas são planejadas na seguinte ordem de prioridade:
1. `spawnRoads`: Estradas essenciais ao redor do spawn.
2. `extensions`: Extensões de energia (RCL 2+).
3. `sourceRoads`: Estradas para as fontes de energia.
4. `controllerRoads`: Estradas para o Controller.
5. `mineralRoads`: Estradas para depósitos de minerais.
6. `sourceContainers`: Containers fixos próximos às fontes.
7. `controllerContainer`: Container fixo para upgrade eficiente.
8. `firstTower`: Primeira torre de defesa.
9. `storage`: Armazenamento central.
10. `secondTower`: Segunda torre de defesa.
11. `rampartsWalls`: Muralhas e rampas de proteção.
12. `links`: Links para transferência rápida de energia.

## Segurança
O planner verifica se a área de construção é segura antes de colocar os sites. Se uma fonte estiver próxima a estruturas ou creeps hostis, o planejamento para aquela área é adiado.

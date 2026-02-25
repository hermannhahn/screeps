# Role: Scout

## Visão Geral
O `scout` é uma unidade de exploração barata e rápida, projetada para explorar salas adjacentes e fornecer informações vitais para a expansão do império.

## Comportamento
- **Alvo Principal:** O `scout` se move para uma sala designada em sua memória (`creep.memory.targetRoom`).
- **Movimento:**
  1. Se não estiver na sala de destino, ele se moverá em direção ao centro da sala alvo.
  2. Uma vez na sala correta, ele procurará por uma bandeira cujo nome corresponda ao seu `creep.memory.scoutTarget`.
  3. Se uma bandeira for encontrada, ele se moverá em direção a ela.
  4. Se nenhuma bandeira for encontrada, ele se moverá em direção ao `controller` da sala para revelar sua posição e estado.
- **Custo:** É uma unidade extremamente barata, consistindo apenas de uma parte `MOVE`, para maximizar a eficiência de custo na exploração.

## Lógica de Spawn
- O `manager.spawner` procurará por bandeiras no mapa com nomes que começam com `scout` (por exemplo, `scout_W1N1`, `scout_exploration`).
- Para cada bandeira encontrada, o spawner verificará se já existe um `scout` atribuído a ela.
- Se não houver, um novo `scout` será criado e terá sua memória configurada para o alvo (`targetRoom` e `scoutTarget`).

## Propósito Estratégico
O `scout` é o primeiro passo para qualquer operação inter-sala. Ele permite:
- **Visão:** Fornece visão contínua de salas de interesse.
- **Planejamento:** Coleta informações essenciais (fontes, controller, terreno, presença inimiga) para planejar futuras operações de mineração remota, reserva ou colonização.
- **Segurança:** Identifica ameaças antes de enviar creeps mais caros.

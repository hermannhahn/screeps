# Role: Scout

## Visão Geral
O `scout` é uma unidade de exploração barata e rápida, projetada para explorar salas adjacentes e fornecer informações vitais para a expansão do império.

## Comportamento
- **Alvo Principal:** O `scout` se move para uma sala designada em sua memória (`creep.memory.targetRoom`).
- **Movimento:**
  1. Se não estiver na sala de destino, ele se moverá em direção ao centro da sala alvo.
  2. Uma vez na sala correta, ele inspecionará os `exits` da sala e adicionará novas salas não exploradas a uma lista global (`Memory.roomsToExplore`).
  3. Ele então se moverá em direção ao `controller` da sala para dar visão e, se o controller estiver assinado por outro jogador, tentará assinar.
  4. Se não houver controller na sala, ele fará um movimento aleatório para cobrir mais terreno.
- **Custo:** É uma unidade extremamente barata, consistindo apenas de uma parte `MOVE`, para maximizar a eficiência de custo na exploração.

## Lógica de Spawn
- O `manager.spawner` criará `scouts` apenas a partir do **RCL 4**.
- **Limite Global:** Para evitar consumo excessivo de CPU e recursos, o sistema mantém apenas **1 scout** ativo globalmente por vez.
- **Prioridade:** O `scout` possui a **menor prioridade** de spawn. Ele só será criado se todas as outras necessidades da colônia (economia, defesa e construção) estiverem atendidas.
- Em vez de bandeiras, o spawner verificará a lista global `Memory.roomsToExplore`.
- Se uma sala nessa lista estiver marcada como `true` (precisando de exploração) e nenhum `scout` estiver ativo, um novo `scout` será spawnado e direcionado para a próxima sala da fila.
- A sala explorada ou em exploração será marcada como `false` em `Memory.roomsToExplore`.

## Propósito Estratégico
O `scout` é o primeiro passo para qualquer operação inter-sala. Ele permite:
- **Visão:** Fornece visão contínua de salas de interesse.
- **Planejamento:** Coleta informações essenciais (fontes, controller, terreno, presença inimiga) para planejar futuras operações de mineração remota, reserva ou colonização.
- **Segurança:** Identifica ameaças antes de enviar creeps mais caros.

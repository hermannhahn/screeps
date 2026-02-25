# Role: Reserver

## Visão Geral
O `reserver` é um creep especializado em reivindicar ou reservar o `controller` de salas neutras ou controladas por outros jogadores para expandir a influência do seu império. Ao reservar um controller, você impede que outros jogadores o reivindiquem por um período e aumenta seu Global Control Level (GCL).

## Comportamento
- **Fluxo Principal:** O creep se move para uma sala alvo (`targetRoom`) e tenta reservar o `controller` dessa sala.
- **Movimento:**
  - Se o creep não estiver na `targetRoom`, ele se moverá em direção ao centro da sala alvo.
  - Uma vez na `targetRoom`, ele se moverá para o `controller` da sala.
- **Reserva do Controller:**
  - Ao alcançar o `controller`, ele chamará `reserveController` continuamente para manter a reserva.
  - Se o creep não possuir partes `CLAIM`, ele não poderá reservar e poderá se autodestruir ou aguardar ser substituído.

## Lógica de Spawn
- O `manager.spawner` será configurado para criar `reservers` com base em flags específicas (ex: `reserver_W1N1`).
- A flag deve conter o `roomName` da sala cujo `controller` será reservado.
- O corpo do creep (`getReserverBody`) será composto principalmente por partes `CLAIM` e `MOVE` para maximizar a capacidade de reserva e a velocidade de viagem.

## Propósito Estratégico
- **Expansão de Território:** Ajuda a expandir a área de controle sem a necessidade de construir um `spawn` em cada sala.
- **Proteção de Fontes Remotas:** Garante que as salas com `remoteHarvesters` e `carriers` permaneçam neutras ou sob sua reserva, impedindo a invasão de outros jogadores.
- **Aumento de GCL:** Cada tick que um controller é reservado contribui para o aumento do seu GCL.

# Role: Carrier

## Visão Geral
O `carrier` é um creep especializado em otimizar a logística de transporte de energia de fontes remotas. Ele atua em conjunto com o `remoteHarvester`, pegando energia de containers remotos e levando-a de volta para a sala principal (`homeRoom`).

## Comportamento
- **Fluxo Principal:** O creep alterna entre retirar energia de um container remoto e entregá-la na sala principal.
- **Retirada de Energia:**
  - Se o creep estiver na `targetRoom` e tiver capacidade livre, ele se moverá para um `container` definido em `creep.memory.remoteContainerId` e retirará energia.
  - Ele só tentará retirar se o container remoto tiver energia disponível. Se o container estiver vazio, o `carrier` retornará para a `homeRoom`.
- **Entrega de Energia:**
  - Se o creep estiver com a carga cheia de energia, ele retornará para a `homeRoom`.
  - Na `homeRoom`, ele utilizará a lógica de `task.deliver` para encontrar o melhor local para descarregar a energia (Spawns, Extensions, Towers, Storage, Containers, etc.).
- **Movimento:** Utiliza `moveTo` com `reusePath` para otimizar o movimento entre as salas.
- **Condicional de Operação:** O `carrier` retornará para a sala principal se não conseguir encontrar o container remoto ou se este estiver vazio.

## Lógica de Spawn
- O `manager.spawner` será configurado para criar `carriers` com base em flags específicas (ex: `carrier_W1N1_ContainerID`).
- A flag deve conter o `roomName` e o `id` do `container` remoto a ser esvaziado.
- O corpo do creep (`getCarrierBody`) será otimizado para transporte, com foco em partes `CARRY` e `MOVE` para maximizar a capacidade e velocidade.

## Propósito Estratégico
- **Otimização da Mineração Remota:** Libera o `remoteHarvester` para focar exclusivamente na colheita de energia, sem precisar viajar para entregar.
- **Aumento de Throughput:** Melhora a eficiência do fluxo de energia das salas remotas para a sala principal.
- **Flexibilidade Logística:** Permite ajustar a quantidade de `carriers` conforme a demanda e a distância das fontes remotas.

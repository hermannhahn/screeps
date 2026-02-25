# Role: Remote Harvester

## Visão Geral
O `remoteHarvester` é um creep especializado em coletar energia de fontes em salas vizinhas (`targetRoom`) e transportá-la de volta para a sala principal (`homeRoom`) para uso.

## Comportamento
- **Fluxo Principal:** O creep alterna entre coletar energia em uma sala remota e entregá-la na sala principal.
- **Coleta de Energia:**
  - Se o creep estiver na `targetRoom` e tiver capacidade livre de carga, ele se moverá para uma `source` definida em `creep.memory.remoteSourceId` e iniciará a colheita.
  - Se `remoteSourceId` não estiver definido ou for inválido, ele tentará encontrar a primeira `source` disponível na sala.
- **Entrega de Energia:**
  - Se o creep estiver com a carga cheia de energia, ele retornará para a `homeRoom`.
  - Na `homeRoom`, ele utilizará a lógica de `task.deliver` para encontrar o melhor local para descarregar a energia (Spawns, Extensions, Towers, Storage, Containers, etc.).
- **Movimento:** Utiliza `moveTo` com `reusePath` para otimizar o movimento entre as salas.

## Lógica de Spawn
- O `manager.spawner` será configurado para criar `remoteHarvesters` com base em flags específicas (ex: `remoteHarvest_W1N1_Source0`).
- A flag deve conter o `roomName` e, opcionalmente, o `id` da `source` a ser explorada.
- O corpo do creep (`getRemoteHarvesterBody`) será otimizado para colheita e transporte, combinando partes `WORK`, `CARRY` e `MOVE`.

## Propósito Estratégico
- **Expansão de Recursos:** Permite acesso a fontes de energia adicionais fora da sala principal.
- **Aceleração do Crescimento:** Aumenta a taxa de produção de energia, acelerando o upgrade do Controller e a construção.
- **Preparação para Colonização:** Prepara o terreno para futuras operações de reserva e colonização de novas salas.

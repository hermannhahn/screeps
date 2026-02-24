# Blueprint: Controller Container

Container dedicado ao upgrade do controlador.

## Lógica
- **Posicionamento:** Colocado a exatamente 1 tile de distância do `room.controller`.
- **Objetivo:** Permitir que o `Upgrader` retire energia e aplique no controlador sem precisar se mover, maximizando o uso da CPU por tick.

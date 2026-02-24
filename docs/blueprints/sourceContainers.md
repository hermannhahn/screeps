# Blueprint: Source Containers

Planeja containers fixos ao lado das fontes de energia.

## Lógica
- **Objetivo:** Permitir que os `Harvesters` depositem energia imediatamente, minimizando perda por decay e facilitando a coleta pelos `Suppliers`.
- **Posicionamento:** Procura uma posição adjacente (distância 1) à fonte que não seja uma parede.
- **Segurança:** Só planeja se a fonte estiver em uma área segura (longe de inimigos).

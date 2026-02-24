# Blueprint: Extensions

Responsável pelo planejamento das extensões de energia da sala.

## Lógica
- **RCL Mínimo:** 2.
- **Posicionamento:** Procura por posições próximas às estradas (`STRUCTURE_ROAD`) a uma distância de pelo menos 2 tiles do Spawn.
- **Espaçamento:** Garante que não haja outras construções no raio de 1 tile para manter o layout limpo e acessível.
- **Quantidade:** Planeja o número máximo permitido para o nível atual do controlador (RCL).

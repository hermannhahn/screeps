# Task: Collect Energy

Módulo universal para coleta de energia, usado por quase todas as roles civis.

## Prioridades de Coleta

1.  **Energia Dropada:** Recursos no chão (evita desperdício por decay).
2.  **Controller Container:** Apenas se o creep for um `Upgrader`.
3.  **Source Containers:** Containers posicionados ao lado das fontes de energia.
4.  **Storage:** Armazenamento central da sala.
5.  **Controller Container:** Fallback para outras roles se as fontes acima falharem.

## Persistência
- Salva o ID do alvo em `memory.targetEnergyId` para evitar que o creep mude de ideia no meio do caminho (oscilação).

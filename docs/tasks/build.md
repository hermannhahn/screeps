# Task: Build

Módulo reutilizável para construção de estruturas.

## Lógica

1.  **Seleção de Alvo:**
    - Se já possui um alvo na memória (`targetBuildId`), continua nele.
    - Se não, busca todos os `ConstructionSites` na sala.
    - **Ordenação:** Prioriza sites com maior progresso percentual (`progress / progressTotal`). Em caso de empate, escolhe o mais próximo.
2.  **Execução:** Move-se até o site e executa `build`. Se o site for concluído, limpa a memória.

# Task: Repair

Módulo responsável pela manutenção de estruturas.

## Lógica

1.  **Seleção de Alvo:**
    - Busca estruturas com `hits < hitsMax`.
    - Prioriza estruturas com menor vida relativa.
2.  **Limiares:**
    - Só seleciona um NOVO alvo se ele estiver com menos de 60% de HP.
    - Uma vez selecionado, continua reparando até atingir 100%.
3.  **Execução:** Move-se até a estrutura e usa `repair`.

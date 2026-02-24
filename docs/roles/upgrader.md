# Role: Upgrader

O **Upgrader** (Aprimorador) foca exclusivamente em aumentar o nível da sala (RCL).

## Comportamento

1.  **Coleta:**
    - Prioridade Máxima: `Link` próximo ao controlador.
    - Segunda Prioridade: `Controller Container`.
    - Fallback: Storage ou energia dropada.
2.  **Ação:** Executa `upgradeController` continuamente.

## Importância
- Mantém a sala ativa e impede que o Controller sofra downgrade por falta de energia.

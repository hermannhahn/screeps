# Role: Upgrader

O **Upgrader** (Aprimorador) foca exclusivamente em aumentar o nível da sala (RCL).

## Comportamento

1.  **Coleta:**
    - Prioridade Máxima: `Link` próximo ao controlador.
    - Segunda Prioridade: `Controller Container`.
    - Fallback: Storage ou energia dropada.
2.  **Ação:** Executa `upgradeController` continuamente.

## Logic Flow (English)

- If `upgrading` is True AND energy is 0:
    - Set `upgrading` = False, Say "fetch"
- If `upgrading` is False AND free capacity is 0:
    - Set `upgrading` = True, Say "upgrade"
- If `upgrading` is True:
    - Run `taskUpgrade.run()`
- Else (Fetching energy):
    - Find closest Link with energy > 0
    - If Link found:
        - If `withdraw` is `ERR_NOT_IN_RANGE`: Move to Link
    - Else:
        - Find closest Container or Storage with energy
        - If found:
            - If `withdraw` is `ERR_NOT_IN_RANGE`: Move to target
        - Else:
            - Find closest dropped energy
            - If found: `pickup` or move
            - Else:
                - Find active source: `harvest` or move

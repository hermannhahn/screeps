# Task: Upgrade

Módulo simples para upgrade do controlador da sala.

## Logic Flow (English)

- If room has controller:
    - If `upgradeController` is `ERR_NOT_IN_RANGE`: Move to controller
    - Return `True`
- Return `False`

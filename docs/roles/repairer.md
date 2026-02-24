# Role: Repairer

O **Repairer** (Reparador) é responsável pela manutenção preventiva e corretiva das estruturas.

## Logic Flow (English)

- If creep energy == 0:
    - Run `taskCollectEnergy.run()`
- Else:
    - Run `taskRepair.run()`
    - If `taskRepair` returns False:
        - Run `taskUpgrade.run()`

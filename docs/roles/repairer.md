# Role: Repairer

O **Repairer** (Reparador) é responsável pela manutenção preventiva e corretiva das estruturas.

## Comportamento

1.  **Coleta:** Busca energia usando `task.collectEnergy`.
2.  **Reparo:** Utiliza a `task.repair` para consertar estruturas.
3.  **Prioridade:** Foca em estruturas com vida abaixo de 60% e continua o reparo até que estejam 100% íntegras.

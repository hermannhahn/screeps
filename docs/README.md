# Documentação Técnica - Automação Screeps

Este guia detalha o funcionamento interno de cada componente do sistema de automação.

## 👥 [Roles (Papéis)](roles/)
Comportamentos individuais de cada tipo de creep:
- [Harvester](roles/harvester.md) - Mineração de energia.
- [Supplier](roles/supplier.md) - Logística e transporte.
- [Upgrader](roles/upgrader.md) - Aprimoramento do Controller.
- [Builder](roles/builder.md) - Construção de estruturas.
- [Repairer](roles/repairer.md) - Manutenção de infraestrutura.
- [Archer](roles/archer.md) - Combate à distância.
- [Guard](roles/guard.md) - Combate corpo-a-corpo.

## 🛠️ [Tasks (Tarefas)](tasks/)
Lógicas modulares reutilizáveis:
- [Collect Energy](tasks/collectEnergy.md) - Busca universal de recursos.
- [Build](tasks/build.md) - Execução de obras.
- [Repair](tasks/repair.md) - Manutenção de vida de estruturas.
- [Upgrade](tasks/upgrade.md) - Upgrade do controlador.

## 🏗️ [Blueprints (Construções)](blueprints/)
Estratégias de planejamento de layout:
- [Extensions](blueprints/extensions.md) - Expansão de capacidade energética.
- [Source Containers](blueprints/sourceContainers.md) - Armazenamento em fontes.
- [Controller Container](blueprints/controllerContainer.md) - Suporte para upgrade.
- [Towers](blueprints/towers.md) - Defesa e reparo automático.
- [Roads](blueprints/roads.md) - Infraestrutura viária.
- [Storage & Links](blueprints/storage_links.md) - Logística avançada.
- [Walls & Ramparts](blueprints/walls_ramparts.md) - Defesas estáticas.

## 🧠 Gerenciamento Global
- **[Manager Planner](planner.md)**: O orquestrador que decide qual blueprint executar e quando.

# GEMINI.md - Contexto de Projeto (Screeps)

Este arquivo fornece contexto e instruções para a IA Gemini atuar neste repositório de automação do jogo **Screeps**.

## 🚀 Visão Geral do Projeto
Script de automação para o jogo de estratégia MMO **Screeps**. O código é focado em escalabilidade, resiliência e eficiência logística.

### Tecnologias e Arquitetura
- **Linguagem:** JavaScript (Node.js/CommonJS).
- **Estrutura:** Modular baseada em Roles (Papéis).
- **Gerenciamento de Spawn:** Spawner inteligente com balanceamento de carga por fonte de energia (Source Saturation).
- **Logística:** Sistema de mineração estática onde `Harvesters` extraem e `Suppliers` transportam.

## 📁 Estrutura de Arquivos
- `main.js`: Loop principal e orquestração global.
- `manager.planner.js`: Inteligência de planejamento de construções e blueprints.
- `role.*.js`: Definições de comportamento para cada tipo de creep (Harvester, Supplier, Upgrader, Builder).
- `README.md`: Documentação para o usuário final.

## 🛠️ Comandos e Operações
- **Deploy:** O código deve ser enviado para o servidor do Screeps.
- **Ajuste de População:** Alterar as fórmulas de `targetHarvesters`, `targetSuppliers` e `targetUpgraders` no `main.js`.
- **Emergência:** Se o spawn parar por falta de energia, os `Harvesters` entrarão automaticamente em modo de abastecimento manual.

## 📝 Convenções de Desenvolvimento
- **Surgical Changes:** Manter a separação de responsabilidades entre as roles.
- **CPU Efficiency:** Sempre utilizar `reusePath` em operações de movimento.
- **Memory Safety:** Verificar sempre se o objeto existe em `Game.getObjectById` antes de interagir.
- **Idiomatic Code:** Seguir o padrão de design do Screeps (ex: usar `_.filter` do lodash que é nativo no jogo).

## 🎯 Próximos Passos (Backlog)
- [x] Implementar Role: **Builder**.
- [x] Desenvolver o **Construction Planner** (Blueprint 1: Anel de estradas no Spawn).
- [ ] Blueprint 2: Estradas conectando Spawn às Fontes e Controller.
- [ ] Blueprint 3: Posicionamento automático de Containers perto das fontes.
- [ ] Implementar Role: **Repairer** para manutenção.

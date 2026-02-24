# Documentação Técnica - Automação Screeps

Esta pasta contém a documentação detalhada da lógica de funcionamento do bot.

## Seções

1. **[Planner](planner.md)**: Explica como a inteligência de planejamento organiza a sala e decide as construções.
2. **[Roles (Papéis)](roles.md)**: Detalha o comportamento de cada tipo de unidade (creep).
3. **[Tasks (Tarefas)](tasks.md)**: Descreve os módulos de lógica reutilizáveis.

---

### Guia de Desenvolvimento
- As roles e tasks estão localizadas em `src/`.
- A lógica de planejamento central está em `src/manager.planner.ts`.
- Os desenhos das estruturas estão em `src/blueprints/`.

# GEMINI.md - Contexto de Projeto (Screeps)

Este arquivo fornece contexto e instruções para a IA Gemini atuar neste repositório de automação do jogo **Screeps**.

## 🚀 Visão Geral do Projeto
Script de automação para o jogo de estratégia MMO **Screeps**. O código é focado em escalabilidade, resiliência e eficiência logística.

### Tecnologias e Arquitetura
- **Linguagem:** TypeScript (compilado para ES2018).
- **Build System:** Webpack para minificação e empacotamento em um único `main.js`.
- **Estrutura:** Modular baseada em Roles (Papéis) em arquivos `.ts`.
- **Gerenciamento de Spawn:** Spawner inteligente com reposição antecipada de creeps (pre-spawning).
- **Logística:** Mineração estática (Harvesters) e logística dinâmica (Suppliers).

## 📁 Estrutura de Arquivos
- `src/main.ts`: Loop principal e orquestração global.
- `src/manager.planner.ts`: Inteligência de planejamento de construções e blueprints.
- `src/role.*.ts`: Comportamentos específicos de creeps (Harvester, Supplier, Upgrader, Builder, Defender).
- `src/task.*.ts`: Módulos de tarefas reutilizáveis (Build, Upgrade, CollectEnergy).
- `dist/main.js`: Arquivo final gerado pelo Webpack para deploy.

## 🛠️ Comandos e Operações
- **Deploy Automático:** Execute `npm run save`. Isso limpa a `dist/`, compila o código, incrementa o contador de deploy e envia para o GitHub.
- **Contador de Deploy:** O arquivo `.deploy_count` rastreia o número total de versões enviadas.
- **Configuração de População:** As metas de população (`targetCount`) estão no `src/main.ts`.

## 📝 Convenções de Desenvolvimento (Surgical Changes)
- **TypeScript Strict:** Manter a tipagem rigorosa para evitar erros de tempo de execução.
- **ES Modules:** Usar `import` e `export default` nos arquivos da `src/`.
- **CPU Efficiency:** Utilizar `reusePath` em movimentos e evitar `room.find` excessivos dentro do loop.
- **Memory Safety:** Sempre verificar se objetos existem em `Game.getObjectById` antes de usá-los.
- **Screeps Compatibility:** O target do TS deve ser `ES2018` para compatibilidade com o ambiente do jogo.

## 🎯 Próximos Passos (Backlog)
- [x] Migração total para TypeScript.
- [x] Sistema de Build com Webpack.
- [x] Deploy automatizado com Git.
- [ ] Implementar Role: **Repairer** para manutenção de estruturas.
- [ ] Otimização de CPU: Caching de resultados de busca frequentes na memória global.
- [ ] Blueprint: Posicionamento automático de Containers perto das fontes.

# GEMINI.md - Contexto de Projeto (Screeps)

Este arquivo fornece contexto e instruções para a IA Gemini atuar neste repositório de automação do jogo **Screeps**.

## 🚀 Visão Geral do Projeto

Script de automação para o jogo de estratégia MMO **Screeps**. O código é focado em escalabilidade, resiliência e eficiência logística.

### Tecnologias e Arquitetura

- **Linguagem:** TypeScript (compilado para ES2018).
- **Build System:** Webpack para minificação e empacotamento em um único `main.js`.
- **Estrutura:** Modular baseada em Roles (Papéis) em arquivos `.ts`.
- **Gerenciamento de Spawn:** Spawner inteligente com reposição antecipada de creeps (pre-spawning). Unidades de combate (Guards/Archers) só são spawnadas com 15+ extensões. Limite global de 1 Scout com prioridade mínima para evitar travamentos econômicos.
- **Logística:** Mineração estática (Harvesters), logística dinâmica (Suppliers) e armazenamento dedicado para upgrade (Controller Container).

## 📁 Estrutura de Arquivos

- `src/main.ts`: Loop principal e orquestração global.
- `src/manager.planner.ts`: Inteligência de planejamento de estruturas, com verificação e reconstrução, ignorando áreas inseguras.
- `src/manager.rooms.ts: Inteligência de planejamento de rooms.
- `src/manager.spawns: Inteligência de geração de creeps.
- `src/tools.ts: Ferramentas em geral.
-  `src/role.*.ts`: Comportamentos específicos de creeps com persistência de alvo na memória para evitar oscilações.
- `src/task.*.ts`: Módulos de tarefas reutilizáveis (Build, Upgrade, CollectEnergy, Repair).
- `dist/main.js`: Arquivo final gerado pelo Webpack para deploy.

## 🛠️ Comandos e Operações

- **Workflow de Alteração:** Sempre que fizer uma alteração, você deve primeiro realizar um `git commit` (com mensagem descritiva) e um `git push`. Somente após isso, execute o comando `npm run deploy` para o deploy.
- **Deploy Automático:** Execute `npm run deploy`. Isso limpa a `dist/`, compila o código, incrementa o contador de deploy, envia para o GitHub e realiza o upload via `screeps-api` para o servidor privado.
- **Configuração do Deploy:** Credenciais do servidor privado ficam no arquivo `screeps.json` (baseado no `screeps.json.example`).

## 📝 Convenções de Desenvolvimento (Surgical Changes)

- **Modularity & No Repetition:** Sempre que possível, organize a lógica em módulos separados (ex: `role.*.ts`, `task.*.ts`, `manager.*.ts`) para evitar repetição de código e promover a manutenibilidade.
- **TypeScript Strict:** Manter a tipagem rigorosa para evitar erros de tempo de execução.
- **ES Modules:** Usar `import` e `export default` nos arquivos da `src/`.
- **CPU Efficiency:** Utilizar `reusePath` em movimentos e evitar `room.find` excessivos dentro do loop.
- **Memory Safety:** Sempre verificar se objetos existem em `Game.getObjectById` antes de usá-los.
- **Screeps Compatibility:** O target do TS deve ser `ES2018` para compatibilidade com o ambiente do jogo.

## 🎯 Instruções Gerais

- Autonomia Máxima: Deve atuar de forma independente para resolver problemas, usando logs e inspeção visual (Chrome DevTools) para validar resultados sem interromper o usuário.
- Interação Mínima: Só solicitar feedback ou confirmação em casos de ambiguidade crítica ou mudanças arquiteturais profundas.
- Ler o arquivo `TODO.md` para entender as tarefas pendentes e prioridades.
- Manter o arquivo `TODO.md` atualizado com novas tarefas e status de progresso.

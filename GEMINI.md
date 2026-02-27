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
- `src/manager.planner.ts`: Inteligência de planejamento que verifica todos os estágios (blueprint stages) e ignora áreas inseguras.
- `src/role.*.ts`: Comportamentos específicos de creeps com persistência de alvo na memória para evitar oscilações.
- `src/task.*.ts`: Módulos de tarefas reutilizáveis (Build, Upgrade, CollectEnergy, Repair).
- `dist/main.js`: Arquivo final gerado pelo Webpack para deploy.

## 🛠️ Comandos e Operações
- **Workflow de Alteração:** Sempre que fizer uma alteração no código, você deve primeiro realizar um `git commit` (com mensagem descritiva) e um `git push`. Somente após isso, execute o comando `npm run deploy` para o deploy.
- **Deploy Automático:** Execute `npm run deploy`. Isso limpa a `dist/`, compila o código, incrementa o contador de deploy, envia para o GitHub e realiza o upload via `screeps-api` para o servidor privado.
- **Configuração do Deploy:** Credenciais do servidor privado ficam no arquivo `screeps.json` (baseado no `screeps.json.example`).
- **Configuração de População:** As metas de população (`targetCount`) estão no `src/main.ts`.

### Ferramentas e Métodos de Depuração
Para auxiliar no debug e teste de funcionalidades, o projeto utiliza o `screeps-multimeter`. Esta ferramenta permite acesso direto ao console do servidor e oferece um plugin "Watch" para monitorar expressões e variáveis no jogo em tempo real.
- **`screeps-multimeter` (executável: `multimeter`):** Console interativo para interagir com o servidor Screeps.
- **Plugin "Watch":** Funcionalidade para monitorar o estado de variáveis e expressões JavaScript dentro do jogo Screeps, com saída no terminal do `multimeter`.
As instruções detalhadas para configuração e uso do `screeps-multimeter` e seu plugin "Watch" estão disponíveis no arquivo `README.md` na seção "🛠️ Ferramentas de Depuração e Monitoramento".

## 📝 Convenções de Desenvolvimento (Surgical Changes)
- **Modularity & No Repetition:** Sempre que possível, organize a lógica em módulos separados (ex: `role.*.ts`, `task.*.ts`, `manager.*.ts`) para evitar repetição de código e promover a manutenibilidade.
- **TypeScript Strict:** Manter a tipagem rigorosa para evitar erros de tempo de execução.
- **ES Modules:** Usar `import` e `export default` nos arquivos da `src/`.
- **CPU Efficiency:** Utilizar `reusePath` em movimentos e evitar `room.find` excessivos dentro do loop.
- **Memory Safety:** Sempre verificar se objetos existem em `Game.getObjectById` antes de usá-los.
- **Screeps Compatibility:** O target do TS deve ser `ES2018` para compatibilidade com o ambiente do jogo.

## 🎯 Próximos Passos (Backlog)
- [x] Migração total para TypeScript.
- [x] Sistema de Build com Webpack.
- [x] Deploy automatizado com Git.
- [x] Implementar Role: **Repairer** para manutenção de estruturas.
- [x] Blueprint: Posicionamento automático de Containers perto das fontes e do Controller.
- [x] Persistência de alvos em memória para evitar oscilações de movimento.
- [x] Suporte a estruturas de RCL 5 (Storage, Links, Segunda Torre).
- [x] Otimização do Planner: Pular estágios não planejáveis para evitar bloqueios sequenciais.
- [ ] Otimização de CPU: Caching de resultados de busca frequentes na memória global.
- [ ] Implementar sistema de Market para venda de excesso de energia/minerais.

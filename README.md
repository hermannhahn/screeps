# Screeps Bot - Automação em TypeScript

Este repositório contém um script robusto e escalável para o jogo **Screeps**, desenvolvido em **TypeScript** e compilado com **Webpack**. O projeto foca em eficiência logística, progressão de sala automatizada e código tipado para maior segurança.

## 🚀 Tecnologias e Arquitetura

- **Linguagem:** TypeScript (ES2018).
- **Build System:** Webpack (Minificação e empacotamento em arquivo único).
- **Deploy:** Sistema de deploy automatizado com contagem de versões e push para o GitHub.
- **Tipagem:** Utiliza `@types/screeps` para suporte completo à API do jogo.

## 📦 Fluxo de Desenvolvimento

O código fonte reside na pasta `src/` e é compilado para a pasta `dist/`.

### Comandos Disponíveis

- `npm run save`: O comando principal de desenvolvimento. Ele realiza as seguintes ações:
  1. Limpa a pasta `dist/`.
  2. Compila todos os arquivos `.ts` em um único `main.js` minificado.
  3. Incrementa o contador de deploy no arquivo `.deploy_count`.
  4. Realiza um `git commit` automático com a mensagem `"Deploy N. X"`.
  5. Faz o `git push` para o repositório remoto.

## 🛠️ Funcionalidades do Script

### 1. Gestão de População (`main.ts`)
- **Spawn Inteligente:** Cálculo de tempo de spawn e viagem para reposição antecipada de creeps.
- **Configuração de Roles:**
  - **Harvesters:** 2 por fonte (mineração estática/drop mining).
  - **Suppliers:** 2 por fonte (logística e abastecimento).
  - **Upgraders:** Dinâmico com base no RCL (`Math.max(1, 4 - RCL)`).
  - **Builders:** 1 ativo quando há construções pendentes.
  - **Defenders:** 3 defensores ativos quando a sala está sob ataque e possui extensões suficientes.

### 2. Comportamentos (Roles)

- **Harvester (`role.harvester.ts`):** Mineração dedicada com lógica de fuga de hostis.
- **Supplier (`role.supplier.ts`):** Logística central. Abastece Spawns, Extensions, Towers e creeps (Upgraders/Builders).
- **Upgrader (`role.upgrader.ts`):** Focado no progresso da sala (RCL/GCL).
- **Builder (`role.builder.ts`):** Focado em construções, priorizando as mais avançadas.
- **Defender (`role.defender.ts`):** Lógica de combate em grupo (Rally point e ataque coordenado).

### 3. Planejamento de Construção (`manager.planner.ts`)
Planejamento automático em estágios (Blueprints):
- **Estágio 0:** Estradas ao redor do Spawn.
- **Estágio 1:** Extensões (até o limite do RCL 2).
- **Estágio 2:** Estradas conectando Fontes.
- **Estágio 3:** Estradas conectando o Controller.
- **Estágio 4:** Estradas conectando Minerais.

## 📁 Estrutura do Projeto

```
/
├── src/                # Código fonte TypeScript
│   ├── main.ts         # Loop principal e lógica de Spawn
│   ├── role.*.ts       # Comportamentos dos Creeps
│   ├── manager.*.ts    # Inteligência de gerenciamento (Planner)
│   └── task.*.ts       # Tarefas modulares (Build, Upgrade, etc.)
├── dist/               # Código compilado (main.js final)
├── package.json        # Dependências e scripts de build
├── tsconfig.json       # Configurações do compilador TypeScript
└── webpack.config.js   # Configurações de empacotamento
```

---
*Nota: Para utilizar este script, configure o seu cliente Steam para ler o arquivo `dist/main.js` ou utilize o comando `npm run save` para enviar as mudanças para o seu repositório sincronizado com o jogo.*

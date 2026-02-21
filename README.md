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
  6. **NOVO**: Envia o código automaticamente para o servidor privado configurado no `screeps.json` via `screeps-api`.

## ⚙️ Configuração do Servidor Privado

Para que o deploy automático funcione, crie um arquivo `screeps.json` na raiz do projeto baseado no `screeps.json.example`:

```json
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha",
  "hostname": "screeps.gohorse.dev",
  "port": 21025,
  "protocol": "http",
  "branch": "default"
}
```
Este arquivo é ignorado pelo Git por segurança.

## 🛠️ Funcionalidades do Script

### 1. Gestão de População (`main.ts`)
- **Spawn Inteligente:** Cálculo de tempo de spawn e viagem para reposição antecipada de creeps (pre-spawning).
- **Configuração de Roles:**
  - **Harvesters:** 2 por fonte. Prioridade máxima.
  - **Defenders:** 3 defensores ativos quando a sala está sob ataque e possui pelo menos 5 extensões.
  - **Suppliers:** 2 por fonte (logística).
  - **Upgraders:** Dinâmico com base no RCL (`Math.max(1, 4 - RCL)`).
  - **Builders:** 1 ativo quando há construções pendentes.

### 2. Comportamentos (Roles)

- **Harvester (`role.harvester.ts`):** 
  - Foca na mineração estática. 
  - **Fuga:** Se houver hostis por perto e a sala tiver defesa (5+ extensões), ele foge.
  - **Entrega:** Se houver Suppliers, deposita em containers próximos (raio 2) ou dropa no chão. Se não houver Suppliers, abastece Spawn/Extensions diretamente.
  
- **Supplier (`role.supplier.ts`):** 
  - **Coleta:** Prioriza energia dropada (acima de 2x sua capacidade) perto das fontes, então containers/storage próximos às fontes.
  - **Entrega:** 
    1. Spawn e Extensions.
    2. Upgraders e Builders sem energia (atribuição 1-para-1 via `assignedSupplier`).
    3. Towers.
  - **Fallback:** Se nada precisar de energia, ajuda na construção ou upgrade.

- **Upgrader (`role.upgrader.ts`):** 
  - Focado exclusivamente no Controlador. 
  - **Coleta:** Usa a tarefa centralizada `task.collectEnergy`, priorizando receber de um Supplier atribuído, então energia dropada, containers perto de fontes e storage.

- **Builder (`role.builder.ts`):** 
  - Focado em construções (`Construction Sites`).
  - **Prioridade de Construção:** Sites mais avançados (maior % de progresso) primeiro; em empate, o mais próximo.
  - **Fallback:** Se não houver construções, ajuda no upgrade.
  - **Coleta:** Mesma lógica do Upgrader via `task.collectEnergy`.

- **Defender (`role.defender.ts`):** 
  - **Estratégia:** Agrupa-se (Rally Point) até atingir 3 unidades antes de atacar coordenadamente o alvo hostil mais próximo do Spawn.
  - **Ataque:** Utiliza ataque à distância (`Ranged Attack`).

### 3. Planejamento de Construção (`manager.planner.ts`)
Executa a cada 100 ticks. Suspende se houver hostis e defesa pronta.
- **Blueprint 0:** Estradas em anel ao redor do Spawn (distância 1).
- **Blueprint 1:** 5 Extensões próximas ao Spawn (mín. distância 2).
- **Blueprint 2:** Estradas conectando Fontes à rede existente.
- **Blueprint 3:** Estradas conectando o Controller.
- **Blueprint 4:** Estradas conectando Minerais.

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

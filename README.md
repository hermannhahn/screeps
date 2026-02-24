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

- `npm run deploy`: O comando principal de desenvolvimento. Ele realiza as seguintes ações:
  1. Limpa a pasta `dist/`.
  2. Compila todos os arquivos `.ts` em um único `main.js` minificado.
  3. Incrementa o contador de deploy no arquivo `.deploy_count`.
  4. Realiza um `git commit` automático com a mensagem `"Deploy N. X"`.
  5. Faz o `git push` para o repositório remoto.
  6. **NOVO**: Envia o código automaticamente para o servidor privado configurado no `screeps.json` via `screeps-api`.

- `npm run ssc`: Inicia o Screeps Steamless Client em segundo plano. Este comando é crucial para interagir com o ambiente de desenvolvimento do Screeps fora do cliente oficial Steam.
  **Importante:** Este comando espera encontrar o arquivo `package.nw` na seguinte localização: `/home/hermann/.steam/steam/steamapps/common/Screeps/package.nw`.
  Se o seu cliente Steamless não iniciar corretamente, é provável que o caminho para `package.nw` esteja diferente em sua máquina. Para corrigir isso:
  1. Localize o arquivo `package.nw` (ou `app.nw`) na instalação do seu Screeps.
     - Geralmente, está dentro da pasta de instalação do jogo Screeps na sua biblioteca Steam (ex: `~/.steam/steam/steamapps/common/Screeps/`).
  2. Edite o arquivo `package.json` na raiz deste projeto.
  3. Altere o valor do script `ssc` para refletir o caminho correto:
     ```json
     "scripts": {
       "ssc": "npx screeps-steamless-client --package /caminho/correto/para/seu/package.nw"
     }
     ```
     Lembre-se de que o comando global `npx screeps-steamless-client` deve estar acessível (instalado via `npm install -g screeps-steamless-client`).


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

### Comandos Disponíveis

- `npm run deploy`: O comando principal de desenvolvimento. Ele realiza as seguintes ações:
  1. Limpa a pasta `dist/`.
  2. Compila todos os arquivos `.ts` em um único `main.js` minificado.
  3. Incrementa o contador de deploy no arquivo `.deploy_count`.
  4. Realiza um `git commit` automático com a mensagem `"Deploy N. X"`.
  5. Faz o `git push` para o repositório remoto.
  6. **NOVO**: Envia o código automaticamente para o servidor privado configurado no `screeps.json` via `screeps-api`.

- `npm run ssc`: Inicia o Screeps Steamless Client em segundo plano. Este comando é crucial para interagir com o ambiente de desenvolvimento do Screeps fora do cliente oficial Steam.
  **Importante:** Este comando espera encontrar o arquivo `package.nw` na seguinte localização: `/home/hermann/.steam/steam/steamapps/common/Screeps/package.nw`.
  Se o seu cliente Steamless não iniciar corretamente, é provável que o caminho para `package.nw` esteja diferente em sua máquina. Para corrigir isso:
  1. Localize o arquivo `package.nw` (ou `app.nw`) na instalação do seu Screeps.
     - Geralmente, está dentro da pasta de instalação do jogo Screeps na sua biblioteca Steam (ex: `~/.steam/steam/steamapps/common/Screeps/`).
  2. Edite o arquivo `package.json` na raiz deste projeto.
  3. Altere o valor do script `ssc` para refletir o caminho correto:
     ```json
     "scripts": {
       "ssc": "npx screeps-steamless-client --package /caminho/correto/para/seu/package.nw"
     }
     ```
     Lembre-se de que o comando global `npx screeps-steamless-client` deve estar acessível (instalado via `npm install -g screeps-steamless-client`).


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

## 🛠️ Ferramentas de Depuração e Monitoramento

Para interagir com o console do seu servidor Screeps e monitorar variáveis em tempo real, utilizamos o `screeps-multimeter`.

### 1. Verificação de Instalação do `multimeter`

Primeiro, verifique se o `screeps-multimeter` (executável como `multimeter`) está instalado globalmente:
```bash
npm list -g multimeter
```
Se não estiver instalado, você pode instalá-lo com:
```bash
npm install -g screeps-multimeter
```

### 2. Configuração do `~/.screeps.yaml`

O `multimeter` usa um arquivo de configuração `~/.screeps.yaml` (na sua pasta home) para armazenar credenciais de servidor.

**Criação e Conteúdo:**
Crie ou edite o arquivo `~/.screeps.yaml` com o seguinte formato, substituindo os valores entre `< >` pelas suas informações reais:

```yaml
servers:
  private:
    host: <SEU_HOST_DO_SERVIDOR_PRIVADO> # Ex: 127.0.0.1 ou o IP/domínio do seu servidor
    port: <SUA_PORTA_DO_SERVIDOR_PRIVADO> # Ex: 21025
    secure: false # Defina como true se o seu servidor privado usa HTTPS
    username: <SEU_USUARIO_DO_SCREEPS_PRIVADO>
    password: <SUA_SENHA_DO_SCREEPS_PRIVADO>
```
**ATENÇÃO:** Mantenha a indentação rigorosa, usando dois espaços para cada nível. Não compartilhe este arquivo, pois ele contém suas credenciais.

### 3. Integração do Plugin "Watch"

Para usar a funcionalidade de "watch" do `multimeter` (monitorar variáveis no jogo):

a. **Copiar `watch-client.js`:**
   Este arquivo precisa estar na pasta `src/` do seu projeto. Copie-o da instalação global do `screeps-multimeter`:
   ```bash
   cp /home/hermann/.nvm/versions/node/v22.17.0/lib/node_modules/screeps-multimeter/lib/watch-client.js ./src/watch-client.js
   ```

b. **Integrar no `main.ts`:**
   Adicione as seguintes linhas ao seu `src/main.ts`:
   *   No início do arquivo:
     ```typescript
     import * as Watcher from './watch-client'; // Adicione esta linha
     ```
   *   Dentro da função `export const loop = () => { ... }`, no início:
     ```typescript
     export const loop = () => {
         Watcher(); // Adicione esta linha
         // ...
     };
     ```
   *   **Importante:** Se você estiver usando o TypeScript de forma estrita, pode ser necessário criar um arquivo de declaração `src/watch-client.d.ts` com o seguinte conteúdo para evitar erros de tipagem:
     ```typescript
     declare function Watcher(): void;
     ```

c. **Deploy das Alterações:**
   Após estas alterações, você deve fazer commit (`git add`, `git commit`), push (`git push`) e deploy (`npm run deploy`) para que o código atualizado vá para o seu servidor Screeps.

### 4. Uso do Console e Comandos `/watch`

Com tudo configurado e o código implantado, você pode iniciar o `multimeter` e usar os comandos de monitoramento:

a. **Conectar ao servidor:**
   ```bash
   multimeter -s private
   ```
   *(Substitua `private` pelo nome que você configurou em `~/.screeps.yaml`)*

b. **Comandos `/watch`:**
   Dentro do console do `multimeter`:
   *   **Monitorar no console (saída de log):**
     ```
     /watch console <SUA_EXPRESSAO_JAVASCRIPT>
     ```
     Ex: `/watch console _.size(Game.creeps)`
   *   **Monitorar na barra de status:**
     ```
     /watch status <SUA_EXPRESSAO_JAVASCRIPT>
     ```
     Ex: `/watch status Game.cpu.getUsed()`
   *   **Remover monitoramento:**
     ```
     /watch unwatch <SUA_EXPRESSAO_JAVASCRIPT>
     ```
   *   **Listar monitoramentos ativos:**
     ```
     /watch list
     ```

## 🛠️ Funcionalidades do Script

### 1. Gestão de População (`main.ts`)
- **Spawn Inteligente:** Cálculo de tempo de spawn e viagem para reposição antecipada de creeps (pre-spawning).
- **Configuração de Roles:**
  - **Harvesters:** 1-2 por fonte (dependendo do RCL). Prioridade máxima.
  - **Defenders (Guards/Archers):** Só são spawnados se a sala estiver sob ataque e possuir pelo menos **15 extensões**.
  - **Suppliers:** `N+1` para `N` sources seguras. Gerenciam o estado `delivering` para máxima eficiência.
  - **Upgraders:** Dinâmico com base no RCL e energia no Storage.
  - **Builders:** 1 ativo quando há construções pendentes.
  - **Repairers:** 1 ativo quando há muitas estruturas precisando de manutenção.

### 2. Comportamentos (Roles)

- **Persistência de Alvos:** Todos os creeps (Builders, Repairers, Suppliers) mantêm seus alvos em memória (`targetBuildId`, `targetRepairId`, etc.) até a conclusão da tarefa ou esgotamento de energia, evitando oscilações de movimento.

- **Reparo Inteligente:** Novos alvos de reparo só são selecionados se a vida da estrutura for inferior a **60%**. Uma vez iniciado, o reparo continua até 100%.

- **Harvester (`role.harvester.ts`):** 
  - Foca na mineração estática. 
  - **Entrega:** Prioriza containers próximos à fonte; caso não existam, dropa a energia para coleta dos Suppliers.
  
- **Supplier (`role.supplier.ts`):** 
  - **Coleta:** Prioriza energia dropada, depois containers de fonte. Evita retirar do Controller Container (exceto em emergências).
  - **Entrega:** 
    1. Spawn e Extensions.
    2. Torres.
    3. Controller Container (armazenamento para Upgraders).
    4. Atribuição direta a Builders/Upgraders.
  - **Fallback:** Se ocioso com energia, ajuda no reparo, construção ou upgrade.

- **Upgrader (`role.upgrader.ts`):** 
  - Focado exclusivamente no Controlador. 
  - **Coleta:** Prioriza o Controller Container (distância 1).

- **Builder (`role.builder.ts`):** 
  - Focado em construções. Fallback para upgrade.

- **Repairer (`role.repairer.ts`):** 
  - Manutenção de infraestrutura (estradas, containers, etc).

- **Defender:**
  - **Guard:** Combate corpo-a-corpo.
  - **Archer:** Combate à distância.
  - Requer 15+ extensões para spawnar.

### 3. Planejamento de Construção (`manager.planner.ts`)
Executa a cada 100 ticks.
- **Robustez:** Verifica todos os estágios desde o início para reconstruir estruturas perdidas.
- **Segurança:** Ignora o planejamento em áreas próximas a inimigos ou estruturas hostis (raio de 5 tiles).
- **Flexibilidade:** Se um estágio está bloqueado (inseguro), pula para o próximo para não travar o progresso.
- **Blueprints:** Spawn, Extensions, Estradas, Source Containers, Controller Container, Towers, Storage, Walls/Ramparts (requer torres), Links.

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
*Nota: Para utilizar este script, configure o seu cliente Steam para ler o arquivo `dist/main.js` ou utilize o comando `npm run deploy` para enviar as mudanças para o seu repositório sincronizado com o jogo.*

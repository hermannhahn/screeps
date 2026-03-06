# GEMINI.md - Project Context (Screeps)

This file provides context and instructions for the Gemini AI to act within this **Screeps** game automation repository.

## 🎯 General Instructions

- Maximum Autonomy: Act independently to solve problems, using logs and visual inspection (Chrome DevTools) to validate logic.
- Minimum Interaction: Only request feedback or confirmation in cases of critical ambiguity or deep architectural changes.
- Read the `TODO.md` file to understand pending tasks and priorities.
- Read the `README.md` file and other files in the `docs/` folder to understand technical details, architecture, and logic.
- Keep the `TODO.md` file updated with new tasks and progress status.
- For each item in each phase, create `.ts` files in the `src/` folder and `.md` files in the `docs/` folder.
- Use the `.md` files to explain the logic applied to the `.ts` files.
- Use the same folder structure and file names in both.

## 🎮 Screeps Simulation (Survival)
- **URL**: `https://screeps.com/a/#!/sim/survival`
- **Login**: `monsticbr@gmail.com`
- **Password**: `Dog11897`
- **Flow**: Sempre que eu pedir para iniciar uma simulação:
  1. Use o `chrome-devtools` para abrir a URL.
  2. Preencha o login e a senha e clique em "SIGN IN".
  3. **Otimização Gráfica** (para PC lento):
     - Clique no ícone de engrenagem (Settings) no canto superior direito.
     - Altere **Lighting** para **Disabled**.
     - Altere **Swamp texture** para **Disabled**.
     - Clique em **OK**.
  4. **Iniciar Jogo**: Selecione o `Spawn` e coloque-o no mapa em uma posição válida para iniciar a execução do código.

## 📈 Automação e Melhoria Contínua
- **Monitorar e Melhorar o Script**: Quando solicitado:
  1. Verifique a simulação periodicamente (ex: a cada 5-10 minutos).
  2. Analise o progresso da base, estoque de energia e comportamento dos creeps.
  3. Realize ajustes proativos no código (`src/`) para otimizar a expansão e eficiência.
  4. Sempre execute a sequência: `git commit` -> `git push` -> `npm run deploy` após cada alteração.
  5. **CRITICAL**: NUNCA utilize a ferramenta `yield_turn` após um `gemini_sleep` ou comandos em background. Isso causa um loop de "System: Please continue" neste terminal. Apenas pare de responder e aguarde a notificação de término do sleep.
  6. O objetivo final é um script 100% autônomo e resiliente.

## 🛡️ Private Servers
Abaixo estão os dados dos servidores privados para monitoramento e verificações:

### 1. NewbieLand
- **Hostname**: `screeps.newbieland.net`
- **Port**: `21025`
- **Protocol**: `http`
- **Email**: `monsticbr@gmail.com`
- **Password**: `Dog!1897`

### 2. GoHorse
- **Hostname**: `screeps.gohorse.dev`
- **Port**: `21025`
- **Protocol**: `http`
- **Email**: `monsticbr@gmail.com`
- **Password**: `Dog!1897`

## 🔗 Private Server Web Access (Steamless Client)
Para acessar a interface web de servidores privados:
1. **Iniciar Redirecionamento**: Execute `npm run ssc` no terminal (caso ainda não esteja rodando).
2. **URL de Acesso**: Use o formato `http://localhost:8080/(http://<hostname>:<port>)/#!/`.
   - Exemplo NewbieLand: `http://localhost:8080/(http://screeps.newbieland.net:21025)/#!/`
   - Exemplo GoHorse: `http://localhost:8080/(http://screeps.gohorse.dev:21025)/#!/`
3. **Ferramenta**: Utilize o `chrome-devtools` para abrir essas URLs e interagir com o jogo.


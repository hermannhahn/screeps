# Screeps Bot - Automação em TypeScript

Script de automação para o jogo MMO Screeps, focado em escalabilidade e eficiência.

## 🛠️ Instalação e Setup

### 1. Clonar o Repositório
```bash
git clone https://github.com/hermannhahn/screeps.git
cd screeps
```

### 2. Instalar Dependências
Certifique-se de ter o Node.js instalado e execute:
```bash
npm install
```

### 3. Onde editar o código
- **Lógica de Roles:** `src/role.*.ts`
- **Lógica de Tasks:** `src/task.*.ts`
- **Planejamento de Sala:** `src/manager.planner.ts` e `src/blueprints/`
- **Configuração de População:** `src/main.ts`

### 4. Configuração do Servidor
Crie um arquivo `screeps.json` na raiz do projeto baseado no `screeps.json.example`:
```json
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha",
  "hostname": "seu-servidor.com",
  "port": 21025,
  "protocol": "http",
  "branch": "default"
}
```

## 🚀 Deploy

Para compilar e enviar o código para o servidor, execute:
```bash
npm run deploy
```
Este comando irá:
1. Limpar e compilar o código via Webpack.
2. Incrementar a versão do deploy.
3. Fazer o commit e push para o GitHub.
4. Enviar o arquivo final (`dist/main.js`) para o servidor configurado.

## 📚 Documentação Técnica
Para entender a lógica detalhada de cada módulo, consulte a [Documentação Técnica na pasta docs](docs/README.md).

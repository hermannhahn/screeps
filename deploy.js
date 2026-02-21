const { ScreepsAPI } = require('screeps-api');
const fs = require('fs');
const path = require('path');

// CONFIGURAÇÃO DO SERVIDOR PRIVADO (Lida do screeps.json)
let options = {};
try {
  const configFile = fs.readFileSync(path.join(__dirname, 'screeps.json'), 'utf8');
  options = JSON.parse(configFile);
} catch (err) {
  console.error('❌ Erro ao ler screeps.json. Certifique-se de que o arquivo existe e está no formato correto.');
  process.exit(1);
}

async function run() {
  const api = new ScreepsAPI(options);
  
  // Login
  try {
    await api.auth();
    console.log(`✅ Logado com sucesso no servidor privado: ${options.hostname}`);

    // Lê o conteúdo do arquivo dist/main.js
    const code = fs.readFileSync(path.join(__dirname, 'dist', 'main.js'), 'utf8');

    // Envia o código para o servidor utilizando a estrutura correta da API v1.x
    const result = await api.code.set(options.branch, { main: code });
    
    if (result.ok) {
        console.log(`🚀 Código enviado com sucesso para o branch: ${options.branch}`);
    } else {
        console.error('❌ Erro no envio:', JSON.stringify(result));
    }
  } catch (err) {
    console.error('❌ Falha na autenticação ou envio:', err.message || err);
  }
}

run();

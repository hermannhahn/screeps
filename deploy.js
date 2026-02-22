const { ScreepsAPI } = require('screeps-api');
const fs = require('fs');
const path = require('path');

// CONFIGURAÇÃO DOS SERVIDORES PRIVADOS (Lida do screeps.json)
let configs = [];
try {
  const configFile = fs.readFileSync(path.join(__dirname, 'screeps.json'), 'utf8');
  configs = JSON.parse(configFile);
  // Ensure configs is an array
  if (!Array.isArray(configs)) {
    configs = [configs]; // Wrap single config in an array for backward compatibility
  }
} catch (err) {
  console.error('❌ Erro ao ler screeps.json. Certifique-se de que o arquivo existe e está no formato correto (pode ser um objeto único ou um array de objetos).');
  process.exit(1);
}

async function run() {
  // Lê o conteúdo do arquivo dist/main.js uma vez
  const code = fs.readFileSync(path.join(__dirname, 'dist', 'main.js'), 'utf8');

  for (const options of configs) {
    const serverName = options.serverName || options.hostname;
    console.log(`\n--- Conectando ao servidor: ${serverName} ---`);

    const api = new ScreepsAPI(options);
    
    try {
      await api.auth();
      console.log(`✅ Logado com sucesso em ${serverName} (${options.hostname})`);

      // Envia o código para o servidor
      const result = await api.code.set(options.branch, { main: code });
      
      if (result.ok) {
          console.log(`🚀 Código enviado com sucesso para o branch '${options.branch}' em ${serverName}`);
      } else {
          console.error(`❌ Erro no envio para ${serverName}:`, JSON.stringify(result));
      }
    } catch (err) {
      console.error(`❌ Falha na autenticação ou envio para ${serverName}:`, err.message || err);
    }
  }
  console.log('\n--- Processo de deploy concluído para todos os servidores configurados ---');
}

run();

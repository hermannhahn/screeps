const { ScreepsAPI } = require('screeps-api');
const fs = require('fs');
const path = require('path');

// PRIVATE SERVER CONFIGURATION (Read from screeps.json)
const configPath = path.join(__dirname, 'screeps.json');
let config;

try {
  const fileContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(fileContent);
} catch (err) {
  console.error('❌ Error reading screeps.json. Make sure the file exists and is in the correct format (it can be a single object or an array of objects).');
  process.exit(1);
}

// Read the content of the dist/main.js file once
const scriptPath = path.join(__dirname, 'dist', 'main.js');
const code = fs.readFileSync(scriptPath, 'utf8');

async function deployToServer(options, serverName) {
  const api = new ScreepsAPI(options);

  try {
    if (options.token) {
      await api.auth(options.token);
    } else {
      await api.auth(options.email, options.password);
    }

    // Send the code to the server
    await api.code.set(options.branch || 'default', { main: code });
    console.log(`🚀 Code successfully sent to branch '${options.branch}' on ${serverName}`);
  } catch (err) {
    console.error(`❌ Authentication or sending failed for ${serverName}:`, err.message || err);
  }
}

async function run() {
  if (Array.isArray(config)) {
    for (const [index, serverConfig] of config.entries()) {
      await deployToServer(serverConfig, serverConfig.hostname || `Server ${index + 1}`);
    }
  } else {
    await deployToServer(config, config.hostname || 'Primary Server');
  }
  console.log('\n--- Deployment process completed for all configured servers ---');
}

run();

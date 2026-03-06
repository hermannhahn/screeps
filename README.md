# Screeps Bot - Automation in TypeScript

Automation script for the MMO game Screeps, focused on scalability and efficiency.

## 🛠️ Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/hermannhahn/screeps.git
cd screeps
```

### 2. Install Dependencies
Make sure you have Node.js installed and run:
```bash
npm install
```

### 3. Server Configuration
Create a `screeps.json` file in the project root based on `screeps.json.example`:
```json
{
  "email": "your-email@example.com",
  "password": "your-password",
  "hostname": "your-server.com",
  "port": 21025,
  "protocol": "http",
  "branch": "default"
}
```

## 🚀 Deploy

To compile and send the code to the server, run:
```bash
npm run deploy
```
This command will:
1. Clean and compile the code via Webpack.
2. Increment the deploy version.
3. Commit and push to GitHub.
4. Send the final file (`dist/main.js`) to the configured server.

## 📚 Technical Documentation
To understand the detailed logic of each module, consult the [Technical Documentation in the docs folder](docs/README.md).

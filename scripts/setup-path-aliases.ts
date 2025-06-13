import * as path from 'path';
import * as fs from 'fs';

// Create a .env file for path aliases if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'NODE_PATH=src\n');
}

// Update package.json to include typeRoots for path aliases
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = require(packageJsonPath);

if (!packageJson.typescript) {
  packageJson.typescript = {};
}

packageJson.typescript.configFile = 'tsconfig.json';

if (!packageJson.types) {
  packageJson.types = ['node_modules/@types', 'src/types'];
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Path aliases setup complete');

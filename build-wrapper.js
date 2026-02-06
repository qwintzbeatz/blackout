const { execSync } = require('child_process');
const args = process.argv.slice(2).filter(arg => arg !== '--no-lint');
execSync(`npx next build ${args.join(' ')}`, { stdio: 'inherit' });

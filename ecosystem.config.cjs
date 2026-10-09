const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'ai-devtracker',
      cwd: path.join(__dirname, 'server'),
      script: 'src/index.js',
      env: { NODE_ENV: 'production' },
    },
  ],
};

const path = require('path');
const Service = require('node-windows').Service;

// Targets the OLD service name so it can be uninstalled
const svc = new Service({
  name: 'PSScheduler',
  script: path.join(__dirname, 'server.js'),
});

svc.on('uninstall', () => {
  console.log('Old PSScheduler service removed.');
  console.log('You can now run: npm run install-service');
});

svc.on('stop', () => {
  console.log('Old service stopped, uninstalling...');
});

console.log('Stopping and removing old PSScheduler service...');
svc.uninstall();

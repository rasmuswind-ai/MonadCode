const path = require('path');
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Monad Code',
  script: path.join(__dirname, 'server.js'),
});

svc.on('uninstall', () => {
  console.log('Monad Code service uninstalled.');
});

svc.uninstall();

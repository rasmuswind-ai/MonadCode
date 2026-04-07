const path = require('path');
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Monad Code',
  description: 'Lightweight PowerShell script scheduler with web UI',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [],
  env: [{
    name: 'MONADCODE_PORT',
    value: process.env.MONADCODE_PORT || '5088'
  }]
});

svc.on('install', () => {
  console.log('Monad Code service installed. Starting...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Monad Code service is already installed.');
});

svc.on('start', () => {
  console.log('Monad Code service started.');
  console.log('Open http://127.0.0.1:5088 in your browser.');
});

svc.on('error', (err) => {
  console.error('Error:', err);
});

svc.install();

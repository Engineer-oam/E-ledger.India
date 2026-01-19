#!/usr/bin/env node

const http = require('http');

const checkService = (name, host, port, path = '/') => {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`${name}: ${res.statusCode === 200 ? 'OK' : 'ERROR'} (${res.statusCode})`);
      resolve(res.statusCode === 200);
    });

    req.on('error', (err) => {
      console.log(`${name}: ERROR - ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`${name}: TIMEOUT`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

const healthCheck = async () => {
  console.log('Running health checks...');
  
  const checks = [
    checkService('Frontend', 'localhost', 3000),
    checkService('Backend API', 'localhost', 3001, '/health'),
    checkService('PostgreSQL', 'localhost', 5432),
    checkService('Redis', 'localhost', 6379),
    checkService('Blockchain Go', 'localhost', 8080, '/health'),
    checkService('Blockchain Rust', 'localhost', 8081, '/health')
  ];

  const results = await Promise.all(checks);
  const allHealthy = results.every(result => result === true);

  console.log(`\nOverall status: ${allHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  process.exit(allHealthy ? 0 : 1);
};

healthCheck().catch(console.error);
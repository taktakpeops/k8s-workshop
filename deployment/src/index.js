'use strict';

const express = require('express');
const request = require('request');

/**
 * METRICS
 */
const http = require('http');
const url = require('url');
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const registry = client.register;

const srv = http.createServer((req, res) => {
  const metricsUrl = url.parse(req.url);
  if (req.method === 'GET' && metricsUrl.pathname === '/metrics') {
    res.statusCode = 200;
    res.setHeader('Content-Type', registry.contentType);
    res.write(`${registry.metrics()}`);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write('{ "message": "nothing to see" }');
  }
  res.end();
});

srv.listen(9003, () => {
  console.log('metrics server started on port 9003');
});

/**
 * APP
 */
const app = express();

const chuckApi = process.env.CHUCK_API || 'https://api.chucknorris.io';

// kill the main event loop for the workshop
app.get('/wait', (_, res) => {
  const time = Date.now();
  while (Date.now() < time + 2000);

  res.json({ message: 'thank you for your patience' });
});

// random endpoint for the micro-service
app.get('/chuck', (_, res) => {
  request.get(`${chuckApi}/jokes/random`, (err, r) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json(JSON.parse(r.body));
  });
});

app.get('/liveness', (_, res) => res.json({ message: 'alive' }));

app.get('/readiness', (_, res) => {
  // do some health checks like is Chuck norris still alive
  request.get(chuckApi, (err, _) => {
    if (err) {
      return res.status(500).json({ message: 'unhealthy' });
    }
    return res.json({ message: 'healthy' });
  });
});

app.listen(9001, error => {
  if (error) {
    throw error;
  }
  console.log('the express server started on :::9001');
});

collectDefaultMetrics();

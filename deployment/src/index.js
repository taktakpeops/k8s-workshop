'use strict';

const express = require('express');
const request = require('request');

const app = express();

const chuckApi = process.env.CHUCK_API || 'https://api.chucknorris.io';

app.get('/wait', (_, res) => {
  const time = Date.now();
  while (Date.now() < time + 2000);

  res.json({ message: 'thank you for your patience' });
});

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
  })
});

app.listen(9001, error => {
  if (error) {
    throw error;
  }
  console.log('the express server started on :::9000');
});

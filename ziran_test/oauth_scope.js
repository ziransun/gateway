process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const http = require('http');
const simpleOAuth2 = require('simple-oauth2');

const CLIENT_ID = 'HollyHoliday'; // 'hello' on 0.3
const CLIENT_SECRET = 'super secret';
const newLocal_1 = '/things/virtual-things-0:readwrite /things/virtual-things-4:readwrite';
const newLocal = newLocal_1;
// const REQUEST_SCOPE = '/things:readwrite'; // 'readwrite' on 0.3
const REQUEST_SCOPE =
  newLocal; // 'readwrite' on 0.3

// const REQUEST_SCOPE = '/things/virtual-things-0:readwrite \
// /things/virtual-things-4:readwrite'; // 'readwrite' on 0.3

const REQUEST_STATE = 'somethingrandom';

const config = {
  client: {
    id: CLIENT_ID,
    secret: CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://127.0.0.1:4443/oauth',
  },
};

const oauth2 = simpleOAuth2.create(config);

const client = express();
const port = 31338;
client.get('/auth', (req, res) => {
  res.redirect(oauth2.authorizationCode.authorizeURL({
    redirect_uri: `http://127.0.0.1:${port}/callback`,
    scope: REQUEST_SCOPE,
    state: REQUEST_STATE,
  }));
});

client.get('/callback', (req, res) => {
  const code = req.query.code;
  console.log('query', req.query);

  oauth2.authorizationCode.getToken({code: code}).then((result) => {
    const token = oauth2.accessToken.create(result);
    res.json(token);
  }).catch((err) => {
    res.status(400).json(err);
  });
});

const clientServer = http.createServer();
clientServer.on('request', client);
clientServer.listen(port);

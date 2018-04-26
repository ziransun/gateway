process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const http = require('http');
const simpleOAuth2 = require('simple-oauth2');
// const io = require('socket.io');

const client = express();
const port = 31338;

const clientServer = http.createServer(client);
const io = require('socket.io').listen(clientServer);
clientServer.listen(port);


let accessToken = '';
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

client.use(express.static('public'));


client.get('/', function(req, res) {
  res.sendfile('index.html');
});


client.get('/auth', (req, res) => {
  res.redirect(oauth2.authorizationCode.authorizeURL({
    // redirect_uri: `http://127.0.0.1:${port}/callback`,
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
    accessToken = token.token.access_token;
    console.log(accessToken);
    res.json(token);
  }).catch((err) => {
    res.status(400).json(err);
  });
});

client.get('/success', (req, res) => {
  res.sendfile('auth.html');
});

/* client.get('/', (req, res) => {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function() {
    console.log(this.responseText);
  });
  xhr.open('GET', 'https://tmp.mozilla-iot.org/things');
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer${atoken}`);
  xhr.send();
});
*/

/* var xhr = new XMLHttpRequest();
xhr.addEventListener('load', function() {
 console.log(this.responseText);
});
xhr.open('GET', 'https://tmp.mozilla-iot.org/things');
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Authorization', 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQ4NTk3O
DEzLTc3YjQtNGZkOC1iNTIwLTY5YzFmMmNkZWZmMiJ9.eyJjbGllbnRfaWQiOiJsb2NhbC10b2tlbiIsInJvbGUiOiJhY2Nlc3N
fdG9rZW4iLCJzY29wZSI6Ii90aGluZ3M6cmVhZHdyaXRlIiwiaWF0IjoxNTIzNTQ5NTg1fQ.u-EemDPairi0zi92Mwivf8gd-3q
4PVU1IBropD6SQRRtKj4X7tQ3Gpkyyjy42ImsULokMH77_XOBXU4vq4z8bA');
xhr.send();
*/

client.use('/static', express.static('node_modules'));

// Handle connection
io.on('connection', function(socket) {
  console.log('Connected succesfully to the socket ...');

  socket.on('requestTemp', function(data) {
    const temp = 16;
    socket.emit('temperature', temp);
    console.log('I\'m listening');
  });
});

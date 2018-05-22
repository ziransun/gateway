process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const http = require('http');
const simpleOAuth2 = require('simple-oauth2');
const fetch = require('node-fetch');

const client = express();
const port = 31338;

const clientServer = http.createServer(client);
const io = require('socket.io').listen(clientServer);
clientServer.listen(port);


let accessToken = '';
const CLIENT_ID = 'HollyHoliday';
const CLIENT_SECRET = 'super secret';
const newLocal = '/things:readwrite';
const REQUEST_SCOPE = newLocal;

const REQUEST_STATE = 'somethingrandom';

const config = {
  client: {
    id: CLIENT_ID,
    secret: CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://sosg.mozilla-iot.org:443/oauth',
  },
};

const oauth2 = simpleOAuth2.create(config);

client.use(express.static('public'));


client.get('/', function(req, res) {
  res.sendfile('index.html');
});


client.get('/auth', (req, res) => {
  res.redirect(oauth2.authorizationCode.authorizeURL({
    redirect_uri: `http://127.0.0.1:${port}/callback`,
    scope: REQUEST_SCOPE,
    state: REQUEST_STATE,
  }));
});

client.use(express.static('public'));

client.get('/callback', (req, res) => {
  const code = req.query.code;
  console.log('query', req.query);

  oauth2.authorizationCode.getToken({code: code}).then((result) => {
    const token = oauth2.accessToken.create(result);
    accessToken = token.token.access_token;
    console.log(accessToken);
    res.sendfile('public/auth.html');
  }).catch((err) => {
    res.status(400).json(err);
  });
});

client.get('/success', (req, res) => {
  res.sendfile('auth.html');
});

const thingsOptions = {
  method: 'GET',
  headers: {
    Authorization: accessToken,
    Accept: 'application/json',
  },
};

const payload = {
  on: true,
};

const switchOptions = {
  method: 'PUT',
  body: JSON.stringify(payload),
  headers: {
    Authorization: accessToken,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

thingsOptions.headers.Authorization = `Bearer ${accessToken}`;

let thingsUrl = '';

function toText(res) {
  return res.text();
}

// Handle connection
io.on('connection', function(socket) {
  console.log('Connected succesfully to the socket ...');
  accessToken = `Bearer ${accessToken}`;
  thingsOptions.headers.Authorization = accessToken;
  switchOptions.headers.Authorization = accessToken;
  socket.on('requestTemp', function() {
    thingsUrl = 'https://sosg.mozilla-iot.org/things/1/properties/level'; // Replace gateway address to your own
    fetch(thingsUrl, thingsOptions).then(toText)
      .then(function(thingBody) {
        if (thingBody.indexOf('access_token used out of scope') !== -1) {
          socket.emit('unauthorized');
        } else {
          const jsonBody = JSON.parse(thingBody);
          const temp = jsonBody.level;
          socket.emit('temperature', temp);
        }
      });
  });

  socket.on('requestFan', function() {
    thingsUrl = 'https://sosg.mozilla-iot.org/things/gpio-5/properties/on'; // Replace gateway address to your own
    fetch(thingsUrl, thingsOptions).then(toText)
      .then(function(thingBody) {
        if (thingBody.indexOf('access_token used out of scope') !== -1) {
          socket.emit('unauthorized');
        } else {
          const jsonBody = JSON.parse(thingBody);
          const fan = jsonBody.on;
          socket.emit('fanStatus', fan);
        }
      });
  });

  socket.on('requestLight', function() {
    thingsUrl = 'https://sosg.mozilla-iot.org/things/0/properties/on'; // Replace gateway address to your own
    fetch(thingsUrl, thingsOptions).then(toText)
      .then(function(thingBody) {
        if (thingBody.indexOf('access_token used out of scope') !== -1) {
          socket.emit('unauthorized');
        } else {
          const jsonBody = JSON.parse(thingBody);
          const light = jsonBody.on;
          socket.emit('lightStatus', light);
        }
      });
  });

  socket.on('switchFan', function(data) {
    thingsUrl = 'https://sosg.mozilla-iot.org/things/gpio-5/properties/on'; // Replace gateway address to your own
    switchOptions.body = JSON.stringify(data);
    fetch(thingsUrl, switchOptions)
      .then((function(response) {
        if (response.status == 200) {
          console.log('switch fan succeed!');
        } else if (response.status == 401) {
          socket.emit('unauthorized');
        } else {
          console.error(`Status ${response.status} trying to switch fan`);
        }
      }).bind(this)).catch(function(error) {
        console.error(`Error trying to switch fan: ${error}`);
      });
  });

  socket.on('switchLight', function(data) {
    thingsUrl = 'https://sosg.mozilla-iot.org/things/0/properties/on'; // Replace gateway address to your own
    switchOptions.body = JSON.stringify(data);
    console.log('switchOptions is:');
    console.log(switchOptions);
    fetch(thingsUrl, switchOptions)
      .then((function(response) {
        if (response.status == 200) {
        //  this.onPropertyStatus({on: true});
          console.log('switch light succeed!');
        } else if (response.status == 401) {
          socket.emit('unauthorized');
        } else {
          console.error(`Status ${response.status} trying to switch light`);
        }
      }).bind(this)).catch(function(error) {
        console.error(`Error trying toswitch light: ${error}`);
      });
  });
});

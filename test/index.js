/* jshint node: true, esversion: 6*/
const app = require('express')();
const http = require('http').Server(app);
const ioc = require('socket.io-client');
const port = 3000;
const socket = ioc('http://localhost:' + port);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

http.listen(80, () => {
  console.log('Listening on *:80');
});

socket.on('connect', () => { console.log('Connected !'); });

socket.on('stream', (data) => { console.log(data); });
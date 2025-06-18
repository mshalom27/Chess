const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');
const { title } = require('process');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const chess = new Chess();

let players = {}
let currentPlayer = "White";

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', {title: 'Chess'});
});

io.on('connection', (uniquesocket) => {
  console.log('A user connected');
})

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
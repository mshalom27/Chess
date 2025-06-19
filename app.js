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

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit('playerRole', 'White');
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit('playerRole', 'Black');
  }else{
    uniquesocket.emit('playerRole', 'Spectator');
  }

  uniquesocket.on("disconnect", () => {
    if(uniquesocket.id === players.white){
      delete players.white;
    }else if (uniquesocket.id === players.black){
      delete players.black;
    }
});

uniquesocket.on("move", (move) => {
  try{
    if(chess.turn() === "w" && uniquesocket.id !== players.white) return;
    if(chess.turn() === "b" && uniquesocket.id !== players.black) return;
    const result = chess.move(move);

    if(result){
      currentPlayer = chess.turn();
      io.emit("move",move);
      io.emit("boardstate", chess.fen()); 
    }else{
      console.log("Invalid move : ",move);
      uniquesocket.emit("invalidMove", move);
    }
  }catch(err){
    uniquesocket.emit("Invalid move : ", move);
  }
});
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
})
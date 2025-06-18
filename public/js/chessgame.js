const socket = io();
const chess = new chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = '';

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = '';
  board.forEach((row, rowindex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement('div');
      squareElement.classList.add('square', (rowindex + square%2 === 0 ? 'light' : 'dark'));
      
      squareElement.dataset.row = rowindex;
      squareElement.dataset.col = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add('piece', square.color === "w" ? "white" : "black");
        
        pieceElement.innerText = "";
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener('dragstart', (event) => {

           if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = {row : rowindex, col: squareindex};
        }

          draggedPiece = pieceElement;
          sourceSquare = squareElement;
          event.dataTransfer.setData('text/plain', '');
        });

      }

      boardElement.appendChild(square);
    });
  });
}

const handleMove = (event) => {
  const targetSquare = event.target;
  if (draggedPiece && targetSquare.classList.contains('square')) {
    const move = `${sourceSquare.dataset.position}${targetSquare.dataset.position}`;
    socket.emit('move', move);
  }
};

const getPieceUnicode = (piece) => {
  if (piece === 'wP') return '\u2659';
  if (piece === 'wR') return '\u2656';
  if (piece === 'wN') return '\u2658';
  if (piece === 'wB') return '\u2657';
  if (piece === 'wQ') return '\u2655';
  if (piece === 'wK') return '\u2654';
  if (piece === 'bP') return '\u265F';
  if (piece === 'bR') return '\u265C';
  if (piece === 'bN') return '\u265E';
  if (piece === 'bB') return '\u265D';
  if (piece === 'bQ') return '\u265B';
  if (piece === 'bK') return '\u265A';
  return '';
};
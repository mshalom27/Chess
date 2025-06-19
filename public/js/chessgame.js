const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = '';
let playerColor = null;

let capturedByWhite = [];
let capturedByBlack = [];
let lastMove = null; 

const getPieceUnicode = (piece) => {
  if (!piece) return '';
  const key = piece.color + piece.type.toUpperCase();
  const unicodePieces = {
    wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
    bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚'
  };
  return unicodePieces[key] || '';
};

const updateCapturedPieces = () => {
  capturedByWhite = [];
  capturedByBlack = [];

  const history = chess.history({ verbose: true });
  history.forEach(move => {
    if (move.flags.includes('c')) {
      if (move.color === 'w') {
        capturedByWhite.push(move.captured.toUpperCase());
      } else {
        capturedByBlack.push(move.captured.toUpperCase());
      }
    }
  });
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = '';

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement('div');
      squareElement.classList.add(
        'square',
        (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (lastMove) {
        const fromRow = 8 - parseInt(lastMove.from[1]);
        const fromCol = lastMove.from.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(lastMove.to[1]);
        const toCol = lastMove.to.charCodeAt(0) - 97;

        if ((rowIndex === fromRow && colIndex === fromCol) || (rowIndex === toRow && colIndex === toCol)) {
          squareElement.classList.add('ring-2', 'ring-yellow-400');
        }
      }

      if (square) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = square.color === playerColor;

        pieceElement.addEventListener('dragstart', (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData('text/plain', '');
          }
        });

        pieceElement.addEventListener('dragend', () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener('dragover', (e) => e.preventDefault());

      squareElement.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerColor === 'b') {
    boardElement.classList.add('flipped');
  } else {
    boardElement.classList.remove('flipped');
  }

  updateCapturedPieces();

  const whiteCapturedContainer = document.getElementById('white-captured');
  const blackCapturedContainer = document.getElementById('black-captured');

  const renderCapturedPieces = (container, capturedPieces, pieceColor) => {
    container.innerHTML = '';
    capturedPieces.forEach(pieceType => {
      const pieceSpan = document.createElement('span');
      pieceSpan.classList.add('captured-piece');
      pieceSpan.innerText = getPieceUnicode({ color: pieceColor, type: pieceType.toLowerCase() });
      container.appendChild(pieceSpan);
    });
  };

  renderCapturedPieces(whiteCapturedContainer, capturedByWhite, 'b');
  renderCapturedPieces(blackCapturedContainer, capturedByBlack, 'w');

  const turnIndicator = document.getElementById('turn-indicator');
  if (turnIndicator) {
    turnIndicator.innerText = chess.turn() === 'w' ? 'White to move' : 'Black to move';
  }

  if (chess.isGameOver()) {
    let message = '';
    if (chess.isCheckmate()) {
      message = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins.`;
    } else if (chess.isStalemate()) {
      message = 'Stalemate!';
    } else if (chess.isThreefoldRepetition()) {
      message = 'Draw by repetition!';
    } else if (chess.isInsufficientMaterial()) {
      message = 'Draw by insufficient material!';
    } else if (chess.isDraw()) {
      message = 'Draw!';
    }

    setTimeout(() => {
      alert(message);
    }, 100);
  }
};

const handleMove = (source, target) => {
  const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
  const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;

  const moves = chess.moves({ verbose: true });
  const attemptedMove = moves.find(m => m.from === from && m.to === to);

  if (attemptedMove) {
    lastMove = { from, to };
    chess.move(attemptedMove);
    socket.emit('move', { from, to, promotion: 'q' });
    renderBoard();
  }
};

socket.on('playerRole', (role) => {
  playerRole = role;
  playerColor = role === 'White' ? 'w' : role === 'Black' ? 'b' : null;

  const tag = document.getElementById('player-tag');
  if (tag) tag.innerText = `You are: ${role}`;

  renderBoard();
});

socket.on('spectatorRole', () => {
  playerRole = 'Spectator';
  playerColor = null;

  const tag = document.getElementById('player-tag');
  if (tag) tag.innerText = `You are: Spectator`;

  renderBoard();
});

socket.on('boardState', (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on('move', (move) => {
  lastMove = move;
  chess.move(move);
  renderBoard();
});

renderBoard();

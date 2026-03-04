const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const playerBanner = document.getElementById('player-banner');
const selector = document.getElementById('piece-selector');
const winOverlay = document.getElementById('win-overlay');
const winMessage = document.getElementById('win-message');

const SIZE = 3;

let board = [];
let currentPlayer = 'white';
let phase = 'placement';
let remaining = {
  white: { rook: 1, bishop: 1, knight: 1 },
  black: { rook: 1, bishop: 1, knight: 1 },
};

let selectedPiece = null;
let selectedCell = null;

const pieces = {
  white: { rook: '♖', bishop: '♗', knight: '♘' },
  black: { rook: '♜', bishop: '♝', knight: '♞' },
};

init();

document.getElementById('restart').addEventListener('click', init);
document.getElementById('play-again').addEventListener('click', init);

function init() {
  board = [];

  for (let y = 0; y < SIZE; y++) {
    board[y] = [];
    for (let x = 0; x < SIZE; x++) {
      board[y][x] = null;
    }
  }

  remaining = {
    white: { rook: 1, bishop: 1, knight: 1 },
    black: { rook: 1, bishop: 1, knight: 1 },
  };

  phase = 'placement';
  currentPlayer = 'white';
  selectedPiece = null;
  selectedCell = null;

  winOverlay.classList.add('hidden');
  drawBoard();
  createPieceSelector();
  updateStatus();
}

function drawBoard() {
  boardElement.innerHTML = '';

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const piece = board[y][x];

      if (piece) {
        cell.textContent = pieces[piece.player][piece.type];
        cell.dataset.player = piece.player;
      }

      if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => cellClicked(x, y));

      boardElement.appendChild(cell);
    }
  }

  highlightMoves();
}

function createPieceSelector() {
  selector.innerHTML = '';

  if (phase !== 'placement') return;

  const available = Object.entries(remaining[currentPlayer]).filter(([, count]) => count > 0);

  // Auto-select if only one piece type left
  if (available.length === 1 && selectedPiece !== available[0][0]) {
    selectedPiece = available[0][0];
  }

  // Clear selection if currently selected piece is no longer available
  if (selectedPiece && remaining[currentPlayer][selectedPiece] === 0) {
    selectedPiece = null;
  }

  available.forEach(([type]) => {
    const btn = document.createElement('span');

    btn.textContent = pieces[currentPlayer][type];
    btn.className = 'piece-btn';
    btn.dataset.type = type;

    if (selectedPiece === type) btn.classList.add('active');

    btn.onclick = () => {
      selectedPiece = type;
      document.querySelectorAll('.piece-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    };

    selector.appendChild(btn);
  });

  // Auto-select the active button visually if auto-selected
  if (selectedPiece && available.length === 1) {
    const btn = selector.querySelector('.piece-btn');
    if (btn) btn.classList.add('active');
  }
}

function cellClicked(x, y) {
  if (phase === 'placement') {
    placePiece(x, y);
  } else {
    movePiece(x, y);
  }
}

function placePiece(x, y) {
  if (board[y][x] !== null) return;
  if (!selectedPiece) return;

  board[y][x] = {
    type: selectedPiece,
    player: currentPlayer,
  };

  remaining[currentPlayer][selectedPiece]--;
  selectedPiece = null;

  const allPlaced =
    Object.values(remaining.white).every((v) => v === 0) &&
    Object.values(remaining.black).every((v) => v === 0);

  if (allPlaced) {
    phase = 'movement';
  }

  switchPlayer();
  drawBoard();
  createPieceSelector();
  updateStatus();
}

function movePiece(x, y) {
  if (selectedCell) {
    const clickedPiece = board[y][x];

    // Click on own piece → switch selection
    if (clickedPiece && clickedPiece.player === currentPlayer) {
      selectedCell = { x, y };
      drawBoard();
      return;
    }

    if (isValidMove(selectedCell.x, selectedCell.y, x, y) && board[y][x] === null) {
      const piece = board[selectedCell.y][selectedCell.x];
      board[y][x] = piece;
      board[selectedCell.y][selectedCell.x] = null;

      if (checkWin(currentPlayer)) {
        const name = currentPlayer === 'white' ? 'Brancas' : 'Pretas';
        showResult(`${name} venceram! 🎉`);
        return;
      }

      selectedCell = null;
      switchPlayer();

      if (!hasAnyMove(currentPlayer)) {
        showResult('Empate — sem movimentos disponíveis!');
        return;
      }

      drawBoard();
      updateStatus();
      return;
    }

    // Invalid target — keep selection, redraw
    drawBoard();
  } else {
    const piece = board[y][x];

    if (piece && piece.player === currentPlayer) {
      selectedCell = { x, y };
    }

    drawBoard();
  }
}

function isValidMove(x1, y1, x2, y2) {
  const piece = board[y1][x1];

  if (!piece) return false;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);

  if (piece.type === 'rook') {
    if (x1 !== x2 && y1 !== y2) return false;
    if (x1 === x2 && y1 === y2) return false;
    if (x1 === x2) {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      for (let y = minY + 1; y < maxY; y++) {
        if (board[y][x1] !== null) return false;
      }
    } else {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      for (let x = minX + 1; x < maxX; x++) {
        if (board[y1][x] !== null) return false;
      }
    }
    return true;
  }

  if (piece.type === 'bishop') {
    if (dx !== dy || dx === 0) return false;
    const stepX = x2 > x1 ? 1 : -1;
    const stepY = y2 > y1 ? 1 : -1;
    let cx = x1 + stepX;
    let cy = y1 + stepY;
    while (cx !== x2 || cy !== y2) {
      if (board[cy][cx] !== null) return false;
      cx += stepX;
      cy += stepY;
    }
    return true;
  }

  if (piece.type === 'knight') {
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
  }

  return false;
}

function hasAnyMove(player) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const piece = board[y][x];
      if (!piece || piece.player !== player) continue;
      for (let ty = 0; ty < SIZE; ty++) {
        for (let tx = 0; tx < SIZE; tx++) {
          if (isValidMove(x, y, tx, ty) && board[ty][tx] === null) return true;
        }
      }
    }
  }
  return false;
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function checkWin(player) {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],

    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],

    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  return lines.some((line) => {
    return line.every(([x, y]) => {
      const p = board[y][x];
      return p && p.player === player;
    });
  });
}

function showResult(message) {
  winMessage.textContent = message;
  winOverlay.classList.remove('hidden');
}

function updateStatus() {
  const isWhite = currentPlayer === 'white';
  document.body.className = isWhite ? 'white-turn' : 'black-turn';

  const name = isWhite ? 'Brancas' : 'Pretas';
  playerBanner.textContent = `Vez das ${name}`;

  const phaseText = phase === 'placement' ? 'Colocação' : 'Movimento';
  statusElement.textContent = phaseText;
}

function highlightMoves() {
  if (!selectedCell) return;

  const cells = document.querySelectorAll('.cell');

  cells.forEach((cell, i) => {
    const x = i % 3;
    const y = Math.floor(i / 3);

    if (isValidMove(selectedCell.x, selectedCell.y, x, y)) {
      if (board[y][x] === null) {
        cell.classList.add('highlight');
      }
    }
  });
}

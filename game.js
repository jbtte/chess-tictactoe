const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const playerBanner = document.getElementById('player-banner');
const selector = document.getElementById('piece-selector');
const winOverlay = document.getElementById('win-overlay');
const winMessage = document.getElementById('win-message');
const modeOverlay = document.getElementById('mode-overlay');

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
let gameMode = null; // 'pvp' | 'easy' | 'hard'

const pieces = {
  white: { rook: '♖', bishop: '♗', knight: '♘' },
  black: { rook: '♜', bishop: '♝', knight: '♞' },
};

// ── Mode selection ──────────────────────────────────────────────────────────

document.getElementById('btn-pvp').addEventListener('click', () => startGame('pvp'));
document.getElementById('btn-easy').addEventListener('click', () => startGame('easy'));
document.getElementById('btn-hard').addEventListener('click', () => startGame('hard'));

document.getElementById('restart').addEventListener('click', showModeOverlay);
document.getElementById('play-again').addEventListener('click', showModeOverlay);

function showModeOverlay() {
  modeOverlay.classList.remove('hidden');
  winOverlay.classList.add('hidden');
}

function startGame(mode) {
  gameMode = mode;
  modeOverlay.classList.add('hidden');
  init();
}

// ── Init ────────────────────────────────────────────────────────────────────

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

// ── Drawing ─────────────────────────────────────────────────────────────────

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

  // Don't show selector when it's the AI's turn
  if (isAITurn()) return;

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

function highlightMoves() {
  if (!selectedCell) return;

  const cells = document.querySelectorAll('.cell');

  cells.forEach((cell, i) => {
    const x = i % 3;
    const y = Math.floor(i / 3);

    if (isValidMove(board, selectedCell.x, selectedCell.y, x, y)) {
      if (board[y][x] === null) {
        cell.classList.add('highlight');
      }
    }
  });
}

// ── Human interaction ────────────────────────────────────────────────────────

function cellClicked(x, y) {
  if (isAITurn()) return;

  if (phase === 'placement') {
    placePiece(x, y);
  } else {
    movePiece(x, y);
  }
}

function placePiece(x, y) {
  if (board[y][x] !== null) return;
  if (!selectedPiece) return;

  applyPlacement(selectedPiece, x, y);
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

    if (isValidMove(board, selectedCell.x, selectedCell.y, x, y) && board[y][x] === null) {
      applyMovement(selectedCell.x, selectedCell.y, x, y);
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

// ── Shared piece application ─────────────────────────────────────────────────

function applyPlacement(pieceType, x, y) {
  board[y][x] = { type: pieceType, player: currentPlayer };
  remaining[currentPlayer][pieceType]--;
  selectedPiece = null;

  const allPlaced =
    Object.values(remaining.white).every((v) => v === 0) &&
    Object.values(remaining.black).every((v) => v === 0);

  if (allPlaced) phase = 'movement';

  switchPlayer();
  drawBoard();
  createPieceSelector();
  updateStatus();
  scheduleAI();
}

function applyMovement(x1, y1, x2, y2) {
  const piece = board[y1][x1];
  board[y2][x2] = piece;
  board[y1][x1] = null;

  if (checkWin(board, currentPlayer)) {
    showResult(getWinMessage(currentPlayer));
    return;
  }

  selectedCell = null;
  switchPlayer();

  if (!hasAnyMove(board, currentPlayer)) {
    showResult('Empate — sem movimentos disponíveis!');
    return;
  }

  drawBoard();
  updateStatus();
  scheduleAI();
}

// ── AI scheduling ────────────────────────────────────────────────────────────

function isAITurn() {
  return gameMode !== 'pvp' && currentPlayer === 'black';
}

function scheduleAI() {
  if (isAITurn()) {
    setTimeout(doAIMove, 450);
  }
}

function doAIMove() {
  if (!isAITurn()) return;

  if (gameMode === 'easy') {
    doEasyMove();
  } else {
    doHardMove();
  }
}

// ── Easy AI (random) ─────────────────────────────────────────────────────────

function doEasyMove() {
  if (phase === 'placement') {
    const available = Object.entries(remaining.black)
      .filter(([, count]) => count > 0)
      .map(([type]) => type);
    const pieceType = available[Math.floor(Math.random() * available.length)];

    const emptyCells = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (board[y][x] === null) emptyCells.push({ x, y });
      }
    }
    const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    applyPlacement(pieceType, target.x, target.y);
  } else {
    const moves = getMovementMoves(board, 'black');
    if (moves.length === 0) {
      showResult('Empate — sem movimentos disponíveis!');
      return;
    }
    const move = moves[Math.floor(Math.random() * moves.length)];
    applyMovement(move.x1, move.y1, move.x2, move.y2);
  }
}

// ── Hard AI (minimax + alpha-beta) ───────────────────────────────────────────

function doHardMove() {
  const state = { board, remaining, phase };
  const moves =
    phase === 'placement'
      ? getPlacementMoves(board, remaining, 'black')
      : getMovementMoves(board, 'black');

  if (moves.length === 0) {
    showResult('Empate — sem movimentos disponíveis!');
    return;
  }

  let bestVal = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const newState = applyMoveToState(state, move, 'black');
    const val = minimax(newState, 'white', 5, -Infinity, Infinity);
    if (val > bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }

  if (bestMove.type === 'place') {
    applyPlacement(bestMove.piece, bestMove.x, bestMove.y);
  } else {
    applyMovement(bestMove.x1, bestMove.y1, bestMove.x2, bestMove.y2);
  }
}

// ── Minimax helpers ──────────────────────────────────────────────────────────

function cloneBoard(b) {
  return b.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function cloneRemaining(r) {
  return {
    white: { ...r.white },
    black: { ...r.black },
  };
}

function getPlacementMoves(b, rem, player) {
  const moves = [];
  const available = Object.entries(rem[player])
    .filter(([, count]) => count > 0)
    .map(([type]) => type);

  for (const piece of available) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (b[y][x] === null) {
          moves.push({ type: 'place', piece, x, y });
        }
      }
    }
  }
  return moves;
}

function getMovementMoves(b, player) {
  const moves = [];
  for (let y1 = 0; y1 < SIZE; y1++) {
    for (let x1 = 0; x1 < SIZE; x1++) {
      const piece = b[y1][x1];
      if (!piece || piece.player !== player) continue;
      for (let y2 = 0; y2 < SIZE; y2++) {
        for (let x2 = 0; x2 < SIZE; x2++) {
          if (isValidMove(b, x1, y1, x2, y2) && b[y2][x2] === null) {
            moves.push({ type: 'move', x1, y1, x2, y2 });
          }
        }
      }
    }
  }
  return moves;
}

function applyMoveToState(state, move, player) {
  const b = cloneBoard(state.board);
  const rem = cloneRemaining(state.remaining);
  let ph = state.phase;

  if (move.type === 'place') {
    b[move.y][move.x] = { type: move.piece, player };
    rem[player][move.piece]--;
    const allPlaced =
      Object.values(rem.white).every((v) => v === 0) &&
      Object.values(rem.black).every((v) => v === 0);
    if (allPlaced) ph = 'movement';
  } else {
    b[move.y2][move.x2] = b[move.y1][move.x1];
    b[move.y1][move.x1] = null;
  }

  return { board: b, remaining: rem, phase: ph };
}

function evaluate(b) {
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

  let score = 0;
  for (const line of lines) {
    let blacks = 0;
    let whites = 0;
    for (const [x, y] of line) {
      const p = b[y][x];
      if (p) {
        if (p.player === 'black') blacks++;
        else whites++;
      }
    }
    if (whites === 0 && blacks > 0) score += blacks * blacks * 10;
    if (blacks === 0 && whites > 0) score -= whites * whites * 10;
  }
  return score;
}

function minimax(state, player, depth, alpha, beta) {
  const b = state.board;

  if (checkWin(b, 'black')) return 10000 + depth;
  if (checkWin(b, 'white')) return -10000 - depth;
  if (depth === 0) return evaluate(b);

  const opponent = player === 'black' ? 'white' : 'black';
  const moves =
    state.phase === 'placement'
      ? getPlacementMoves(b, state.remaining, player)
      : getMovementMoves(b, player);

  if (moves.length === 0) return evaluate(b);

  if (player === 'black') {
    let best = -Infinity;
    for (const move of moves) {
      const newState = applyMoveToState(state, move, player);
      const val = minimax(newState, opponent, depth - 1, alpha, beta);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const newState = applyMoveToState(state, move, player);
      const val = minimax(newState, opponent, depth - 1, alpha, beta);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ── Game rules ───────────────────────────────────────────────────────────────

function isValidMove(b, x1, y1, x2, y2) {
  const piece = b[y1][x1];

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
        if (b[y][x1] !== null) return false;
      }
    } else {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      for (let x = minX + 1; x < maxX; x++) {
        if (b[y1][x] !== null) return false;
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
      if (b[cy][cx] !== null) return false;
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

function hasAnyMove(b, player) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const piece = b[y][x];
      if (!piece || piece.player !== player) continue;
      for (let ty = 0; ty < SIZE; ty++) {
        for (let tx = 0; tx < SIZE; tx++) {
          if (isValidMove(b, x, y, tx, ty) && b[ty][tx] === null) return true;
        }
      }
    }
  }
  return false;
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function checkWin(b, player) {
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
      const p = b[y][x];
      return p && p.player === player;
    });
  });
}

// ── UI ───────────────────────────────────────────────────────────────────────

function getWinMessage(winner) {
  if (gameMode === 'pvp') {
    return `${winner === 'white' ? 'Brancas' : 'Pretas'} venceram! 🎉`;
  }
  return winner === 'white' ? 'Você venceu! 🎉' : 'Computador venceu!';
}

function showResult(message) {
  winMessage.textContent = message;
  winOverlay.classList.remove('hidden');
}

function updateStatus() {
  const isWhite = currentPlayer === 'white';
  document.body.className = isWhite ? 'white-turn' : 'black-turn';

  if (gameMode === 'pvp') {
    const name = isWhite ? 'Brancas' : 'Pretas';
    playerBanner.textContent = `Vez das ${name}`;
  } else {
    playerBanner.textContent = isWhite ? 'Sua vez' : 'Computador...';
  }

  const phaseText = phase === 'placement' ? 'Colocação' : 'Movimento';
  statusElement.textContent = phaseText;
}

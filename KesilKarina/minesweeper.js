const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null
};

let board = [];

function generateField(rows, cols, minesCount) {
  const field = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0
      });
    }
    field.push(row);
  }

  let minesLeft = minesCount;
  while (minesLeft > 0) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (field[r][c].type !== 'mine') {
      field[r][c].type = 'mine';
      minesLeft--;
    }
  }

  return field;
}

function countNeighbourMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (board[r][c].type === 'empty') {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 && nr < gameState.rows &&
              nc >= 0 && nc < gameState.cols &&
              board[nr][nc].type === 'mine'
            ) {
              count++;
            }
          }
        }
        board[r][c].neighborMines = count;
      }
    }
  }
}

function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;

  const cell = board[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    gameState.status = 'lose';
    stopTimer();
    revealAllMines();
    renderBoard();
    updateStatus();
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        openCell(row + dr, col + dc);
      }
    }
  }

  if (checkWin()) {
    gameState.status = 'win';
    stopTimer();
    renderBoard();
    updateStatus();
    return;
  }

  renderBoard();
}

function checkWin() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = board[r][c];
      if (cell.type === 'empty' && cell.state !== 'opened') {
        return false;
      }
    }
  }
  return true;
}

function revealAllMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (board[r][c].type === 'mine') {
        board[r][c].state = 'opened';
      }
    }
  }
}

function toggleFlag(row, col) {
  const cell = board[row][col];

  if (cell.state === 'opened') return;

  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
  }

  updateFlagCount();
  renderBoard();
}

function startTimer() {
  if (gameState.timerId !== null) return;
  gameState.timerId = setInterval(function () {
    gameState.gameTime++;
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.innerText = gameState.gameTime;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

window.onload = function () {
  startGame();
};

function startGame() {
  gameState.status = 'process';
  gameState.gameTime = 0;
  stopTimer();

  board = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines();

  updateFlagCount();
  updateStatus();
  renderBoard();

  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) timerDisplay.innerText = 0;
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = board[r][c];
      const tile = document.createElement('div');
      tile.classList.add('tile');

      if (cell.state === 'opened') {
        tile.classList.add('tile-clicked');
        if (cell.type === 'mine') {
          tile.innerText = '💣';
          tile.style.backgroundColor = 'red';
        } else if (cell.neighborMines > 0) {
          tile.innerText = cell.neighborMines;
          tile.classList.add('x' + cell.neighborMines);
        }
      } else if (cell.state === 'flagged') {
        tile.innerText = '🚩';
      }

      tile.addEventListener('click', function () {
        if (gameState.status !== 'process') return;
        startTimer();
        openCell(r, c);
      });

      tile.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (gameState.status !== 'process') return;
        toggleFlag(r, c);
      });

      boardEl.append(tile);
    }
  }
}

function updateFlagCount() {
  let flagged = 0;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (board[r][c].state === 'flagged') flagged++;
    }
  }
  const minesCountEl = document.getElementById('mines-count');
  if (minesCountEl) {
    minesCountEl.innerText = gameState.minesCount - flagged;
  }
}

function updateStatus() {
  const minesCountEl = document.getElementById('mines-count');
  if (gameState.status === 'win' && minesCountEl) {
    minesCountEl.innerText = 'Cleared! 🎉';
  } else if (gameState.status === 'lose' && minesCountEl) {
    minesCountEl.innerText = 'Game Over 💥';
  }
}
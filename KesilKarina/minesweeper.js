const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose'
};

const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine'
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged'
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null
};

let board = [];

function generateField(rows, cols, minesCount) {
  const field = [];
  for (let row = 0; row < rows; row++) {
    const boardRow = [];
    for (let col = 0; col < cols; col++) {
      boardRow.push({
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0
      });
    }
    field.push(boardRow);
  }

  let minesLeft = minesCount;
  while (minesLeft > 0) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (field[row][col].type !== CELL_TYPE.MINE) {
      field[row][col].type = CELL_TYPE.MINE;
      minesLeft--;
    }
  }

  return field;
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (board[row][col].type === CELL_TYPE.EMPTY) {
        let count = 0;
        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
          for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
            if (directionalRow === 0 && directionalCol === 0) continue;
            const neighbourRow = row + directionalRow;
            const neighbourCol = col + directionalCol;
            if (
              neighbourRow >= 0 && neighbourRow < gameState.rows &&
              neighbourCol >= 0 && neighbourCol < gameState.cols &&
              board[neighbourRow][neighbourCol].type === CELL_TYPE.MINE
            ) {
              count++;
            }
          }
        }
        board[row][col].neighborMines = count;
      }
    }
  }
}

function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
    
    return;
  }

  const cell = board[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    
    return;
  }

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    revealAllMines();
    renderBoard();
    updateStatus();
    
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
      for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
        if (directionalRow === 0 && directionalCol === 0) continue;
        openCell(row + directionalRow, col + directionalCol);
      }
    }
  }

  if (checkWin()) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
    renderBoard();
    updateStatus();
    
    return;
  }

  renderBoard();
}

function checkWin() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = board[row][col];
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
        
        return false;
      }
    }
  }
  
  return true;
}

function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (board[row][col].type === CELL_TYPE.MINE) {
        board[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function toggleFlag(row, col) {
  const cell = board[row][col];

  if (cell.state === CELL_STATE.OPENED) {
    
    return;
  }

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }

  updateFlagCount();
  renderBoard();
}

function startTimer() {
  if (gameState.timerId !== null) {
    
    return;
  }
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
  gameState.status = GAME_STATUS.PROCESS;
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

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = board[row][col];
      const tile = document.createElement('div');
      tile.classList.add('tile');

      if (cell.state === CELL_STATE.OPENED) {
        tile.classList.add('tile-clicked');
        if (cell.type === CELL_TYPE.MINE) {
          tile.innerText = '💣';
          tile.style.backgroundColor = 'red';
        } else if (cell.neighborMines > 0) {
          tile.innerText = cell.neighborMines;
          tile.classList.add('x' + cell.neighborMines);
        }
      } else if (cell.state === CELL_STATE.FLAGGED) {
        tile.innerText = '🚩';
      }

      tile.addEventListener('click', function () {
        if (gameState.status !== GAME_STATUS.PROCESS) {
          
          return;
        }
        startTimer();
        openCell(row, col);
      });

      tile.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (gameState.status !== GAME_STATUS.PROCESS) {
          
          return;
        }
        toggleFlag(row, col);
      });

      boardEl.append(tile);
    }
  }
}

function updateFlagCount() {
  let flagged = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (board[row][col].state === CELL_STATE.FLAGGED) flagged++;
    }
  }
  const minesCountEl = document.getElementById('mines-count');
  if (minesCountEl) {
    minesCountEl.innerText = gameState.minesCount - flagged;
  }
}

function updateStatus() {
  const minesCountEl = document.getElementById('mines-count');
  if (gameState.status === GAME_STATUS.WIN && minesCountEl) {
    minesCountEl.innerText = 'Cleared! 🎉';
  } else if (gameState.status === GAME_STATUS.LOSE && minesCountEl) {
    minesCountEl.innerText = 'Game Over 💥';
  }
}
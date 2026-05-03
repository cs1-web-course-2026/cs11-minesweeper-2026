
const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };
const CELL_CONTENT = { MINE: 'mine', EMPTY: 'empty' };
const GAME_STATUS = { PLAYING: 'playing', WON: 'won', LOST: 'lost' };

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  flagsUsed: 0,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  field: []
};

function generateField(rows, cols, minesCount) {
  gameState.field = [];
  gameState.flagsUsed = 0;
  
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < cols; col++) {
      rowData.push({ type: CELL_CONTENT.EMPTY, state: CELL_STATE.CLOSED, neighborMines: 0 });
    }
    gameState.field.push(rowData);
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);
    if (gameState.field[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
      gameState.field[randomRow][randomCol].type = CELL_CONTENT.MINE;
      placedMines++;
    }
  }
}

function isInside(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function countNeighbourMines(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CELL_CONTENT.MINE) continue;
      let count = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          const neighborRow = row + rowOffset;
          const neighborCol = col + colOffset;
          if (isInside(neighborRow, neighborCol, rows, cols) && field[neighborRow][neighborCol].type === CELL_CONTENT.MINE) {
            count++;
          }
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}

const gridElement = document.getElementById('grid');
const timerElement = document.getElementById('timer');
const flagsElement = document.getElementById('flags-count');
const smileBtn = document.getElementById('smile-btn');
const messageElement = document.getElementById('game-message');

function formatNumber(num) {
  return num.toString().padStart(3, '0');
}

function updateUI() {
  timerElement.textContent = formatNumber(gameState.gameTime);
  flagsElement.textContent = formatNumber(gameState.minesCount - gameState.flagsUsed);
  
  if (gameState.status === GAME_STATUS.LOST) smileBtn.textContent = '😵';
  else if (gameState.status === GAME_STATUS.WON) smileBtn.textContent = '😎';
  else smileBtn.textContent = '🙂';
}

function showMessage(msg) {
  if (messageElement) messageElement.textContent = msg;
}

function renderBoard() {
  gridElement.innerHTML = ''; // Очищаємо поле
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const btn = document.createElement('button');
      btn.classList.add('cell');
      btn.dataset.row = row;
      btn.dataset.col = col;
      gridElement.appendChild(btn);
    }
  }
}

function updateBoard() {
  const cells = gridElement.children;
  let index = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellData = gameState.field[row][col];
      const btn = cells[index];

      btn.className = 'cell';
      btn.textContent = '';
      btn.removeAttribute('data-mines');

      if (cellData.state === CELL_STATE.OPENED) {
        btn.classList.add('opened');
        if (cellData.type === CELL_CONTENT.MINE) {
          btn.classList.add('mine');
          btn.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
          btn.textContent = cellData.neighborMines;
          btn.dataset.mines = cellData.neighborMines;
        }
      } else if (cellData.state === CELL_STATE.FLAGGED) {
        btn.classList.add('flagged');
        btn.textContent = '🚩';
      }
      index++;
    }
  }
}

function openCell(row, col) {
  if (!isInside(row, col, gameState.rows, gameState.cols)) return;
  const cell = gameState.field[row][col];
  
  if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PLAYING) return;

  if (gameState.gameTime === 0 && !gameState.timerId) startTimer(); // Запускаємо таймер при першому кліку

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_CONTENT.MINE) {
    gameState.status = GAME_STATUS.LOST;
    clearInterval(gameState.timerId);
    showMessage('Game Over! Ви підірвалися на міні.');
    revealAllMines();
  } else if (cell.neighborMines === 0) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        openCell(row + rowOffset, col + colOffset);
      }
    }
  }
  checkWin();
  updateBoard();
  updateUI();
}

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED || gameState.status !== GAME_STATUS.PLAYING) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsUsed++;
  } else {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsUsed--;
  }
  updateBoard();
  updateUI();
}

function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_CONTENT.MINE) {
        gameState.field[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function checkWin() {
  let closedEmpty = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      if (cell.type === CELL_CONTENT.EMPTY && cell.state !== CELL_STATE.OPENED) closedEmpty++;
    }
  }
  if (closedEmpty === 0 && gameState.status === GAME_STATUS.PLAYING) {
    gameState.status = GAME_STATUS.WON;
    clearInterval(gameState.timerId);
    showMessage('Вітаємо! Ви перемогли!');
  }
}

function startTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateUI();
  }, 1000);
}

gridElement.addEventListener('click', (e) => {
  const btn = e.target.closest('.cell');
  if (!btn) return;
  const row = parseInt(btn.dataset.row);
  const col = parseInt(btn.dataset.col);
  openCell(row, col);
});

gridElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const btn = e.target.closest('.cell');
  if (!btn) return;
  const row = parseInt(btn.dataset.row);
  const col = parseInt(btn.dataset.col);
  toggleFlag(row, col);
});

smileBtn.addEventListener('click', initGame);

function initGame() {
  clearInterval(gameState.timerId);
  gameState.status = GAME_STATUS.PLAYING;
  gameState.gameTime = 0;
  gameState.timerId = null;
  showMessage('Гру почато! Успіху.');
  
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field, gameState.rows, gameState.cols);
  renderBoard();
  updateBoard();
  updateUI();
}

initGame();
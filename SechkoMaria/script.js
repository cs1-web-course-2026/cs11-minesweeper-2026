
const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged'
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty'
};

const GAME_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  field: [] 
};

function generateField(rows, cols, minesCount) {
  gameState.field = [];
  
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < cols; col++) {
      rowData.push({
        type: CELL_CONTENT.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0
      });
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
          
          if (isInside(neighborRow, neighborCol, rows, cols)) {
            if (field[neighborRow][neighborCol].type === CELL_CONTENT.MINE) {
              count++;
            }
          }
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}

function showMessage(msg) {
  const msgElement = document.getElementById('game-message');
  if (msgElement) {
    msgElement.textContent = msg;
  }
  console.log(msg);
}

function openCell(row, col, state) {
  if (!isInside(row, col, state.rows, state.cols)) return;

  const cell = state.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED || state.status !== GAME_STATUS.PLAYING) return;

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_CONTENT.MINE) {
    state.status = GAME_STATUS.LOST;
    clearInterval(state.timerId);
    showMessage('Game Over! Ви підірвалися на міні.');
    return;
  }

  if (cell.neighborMines === 0) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        const neighborRow = row + rowOffset;
        const neighborCol = col + colOffset;
        if (isInside(neighborRow, neighborCol, state.rows, state.cols)) {
          openCell(neighborRow, neighborCol, state);
        }
      }
    }
  }
  checkWin(state);
}


function toggleFlag(row, col, state) {
  if (!isInside(row, col, state.rows, state.cols)) return;

  const cell = state.field[row][col];
  if (cell.state === CELL_STATE.OPENED || state.status !== GAME_STATUS.PLAYING) return;

  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function checkWin(state) {
  let closedEmpty = 0;
  state.field.forEach(rowData => {
    rowData.forEach(cell => {
      if (cell.type === CELL_CONTENT.EMPTY && cell.state !== CELL_STATE.OPENED) {
        closedEmpty++;
      }
    });
  });

  if (closedEmpty === 0) {
    state.status = GAME_STATUS.WON;
    clearInterval(state.timerId);
    showMessage('Вітаємо! Ви перемогли!');
  }
}

function initGame() {
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field, gameState.rows, gameState.cols);

  showMessage('Гру ініціалізовано. Поле готове.');
  console.log(gameState.field);
}

initGame();
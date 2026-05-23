const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: []
};

function generateField(rows, cols, minesCount) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.field = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0
      });
    }
    gameState.field.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    if (gameState.field[randomRow][randomCol].type !== 'mine') {
      gameState.field[randomRow][randomCol].type = 'mine';
      minesPlaced++;
    }
  }

  countNeighbourMines();
  startTimer();
}

function countNeighbourMines() {
  const rows = gameState.rows;
  const cols = gameState.cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (gameState.field[r][c].type === 'mine') continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const neighborRow = r + dr;
          const neighborCol = c + dc;

          if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
            if (gameState.field[neighborRow][neighborCol].type === 'mine') {
              count++;
            }
          }
        }
      }
      gameState.field[r][c].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== 'process') return;
  
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    endGame('lose');
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const neighborRow = row + dr;
        const neighborCol = col + dc;

        if (neighborRow >= 0 && neighborRow < gameState.rows && neighborCol >= 0 && neighborCol < gameState.cols) {
          openCell(neighborRow, neighborCol);
        }
      }
    }
  }

  checkWinCondition();
}

function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;

  const cell = gameState.field[row][col];
  if (cell.state === 'opened') return;

  cell.state = cell.state === 'closed' ? 'flagged' : 'closed';
}

function startTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function checkWinCondition() {
  let allSafeCellsOpened = true;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.field[r][c];
      if (cell.type === 'empty' && cell.state !== 'opened') {
        allSafeCellsOpened = false;
        break;
      }
    }
  }

  if (allSafeCellsOpened) {
    endGame('win');
  }
}

function endGame(finalStatus) {
  gameState.status = finalStatus;
  clearInterval(gameState.timerId);
}

generateField(10, 10, 15);
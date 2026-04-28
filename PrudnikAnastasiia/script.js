const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const CELL_TYPE = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const GAME_STATUS = {
  PLAYING: 'process',
  WON: 'win',
  LOST: 'lose',
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 16, // Налаштування складності
  status: GAME_STATUS.PLAYING, // Поточний стан гри: 'process' | 'win' | 'lose'
  gameTime: 0, // Час гри у секундах
  timerID: null, // Посилання на ідентифікатор таймера для його зупинки (clearInterval)
  field: [],
};

const timerRightElement = document.querySelector('.TimeNumRight');
const flagCountElement = document.querySelector('.FlagCount');
const numLeftElement = document.querySelector('.TimeNumLeft');
const gameContainer = document.querySelector('.Game');
const restartButton = document.querySelector('.Button');
const gameMessageElement = document.getElementById('GameMessage');

function updateTimerDisplay() {
  if (timerRightElement) {
    timerRightElement.textContent = String(gameState.gameTime).padStart(3, '0');
  }
}

function updateFlagCount() {
  const flagCount = gameState.field
    .flat()
    .filter((cell) => cell.state === CELL_STATE.FLAGGED).length;
  const flagsRemained = gameState.minesCount - flagCount;
  if (flagCountElement) {
    flagCountElement.textContent = `Кількість прапорців: ${flagsRemained}`;
  }
  if (numLeftElement) {
    numLeftElement.textContent = String(Math.max(0, flagsRemained)).padStart(3, '0');
  }
}

function render() {
  gameContainer.innerHTML = '';
  gameState.field.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'CellRow';
    row.forEach((cell, colIndex) => {
      const cellButton = document.createElement('button');
      cellButton.type = 'button';
      if (cell.state === CELL_STATE.CLOSED) {
        cellButton.className = 'EmptyCell';
      } else if (cell.state === CELL_STATE.FLAGGED) {
        cellButton.className = 'FlagCell';
      } else if (cell.state === CELL_STATE.OPENED) {
        if (cell.type === CELL_TYPE.MINE) {
          cellButton.className = 'BombCell';
        } else {
          cellButton.className = 'EmptyCellOpened';
          if (cell.neighbourMines > 0) {
            cellButton.innerHTML = `<p class = "NumCell">${cell.neighbourMines}</p>`;
          }
        }
      }
      let stateLabel;
      if (cell.state === CELL_STATE.FLAGGED) {
        stateLabel = 'flagged';
      } else if (
        cell.state === CELL_STATE.OPENED &&
        cell.type === CELL_TYPE.MINE
      ) {
        stateLabel = 'mine';
      } else if (cell.state === CELL_STATE.OPENED) {
        stateLabel = 'opened, ' + cell.neighbourMines + ' adjacent mines';
      } else {
        stateLabel = 'closed';
      }
      cellButton.setAttribute(
        'aria-label',
        'Row ' +
          (rowIndex + 1) +
          ', column ' +
          (colIndex + 1) +
          ', ' +
          stateLabel,
      );
      cellButton.addEventListener('click', () => {
        openCell(rowIndex, colIndex);
        render();
      });
      cellButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(rowIndex, colIndex);
        render();
      });
      rowDiv.appendChild(cellButton);
    });
    gameContainer.appendChild(rowDiv);
  });
  updateFlagCount();
}

function generateField(rows, cols, minesCount) {
  gameState.field = [];
  for (let row = 0; row < rows; row++) {
    const rowCells = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push({
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighbourMines: 0,
        row,
        col,
      });
    }
    gameState.field.push(rowCells);
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (gameState.field[row][col].type !== CELL_TYPE.MINE) {
      gameState.field[row][col].type = CELL_TYPE.MINE;
      placedMines++;
    }
  }
  countNeighbourMines();
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) {
        continue;
      }
      let adjacentMineCount = 0;
      for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
        for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
          const neighbourRow = row + deltaRow;
          const neighbourCol = col + deltaCol;
          if (
            neighbourRow >= 0 &&
            neighbourRow < gameState.rows &&
            neighbourCol >= 0 &&
            neighbourCol < gameState.cols
          ) {
            if (
              gameState.field[neighbourRow][neighbourCol].type ===
              CELL_TYPE.MINE
            ) {
              adjacentMineCount++;
            }
          }
        }
      }
      gameState.field[row][col].neighbourMines = adjacentMineCount;
    }
  }
}

function openCell(row, col) {
  const cell = gameState.field[row][col];
  if (
    cell.state !== CELL_STATE.CLOSED ||
    gameState.status !== GAME_STATUS.PLAYING
  ) {
    return;
  }
  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    endGame(GAME_STATUS.LOST);

    return;
  }
  cell.state = CELL_STATE.OPENED;
  if (cell.neighbourMines === 0) {
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        const neighbourRow = row + deltaRow;
        const neighbourCol = col + deltaCol;
        if (
          neighbourRow >= 0 &&
          neighbourRow < gameState.rows &&
          neighbourCol >= 0 &&
          neighbourCol < gameState.cols
        ) {
          openCell(neighbourRow, neighbourCol);
        }
      }
    }
  }
  checkWin();
}

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (
    cell.state === CELL_STATE.OPENED ||
    gameState.status !== GAME_STATUS.PLAYING
  ) {
    return;
  }
  if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  } else {
    cell.state = CELL_STATE.FLAGGED;
  }
  updateFlagCount();
}

function startTimer() {
  if (gameState.timerID) {
    clearInterval(gameState.timerID);
  }
  gameState.gameTime = 0;
  updateTimerDisplay();
  gameState.timerID = setInterval(() => {
    gameState.gameTime++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerID);
}

function checkWin() {
  let closedEmptyCells = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (
        gameState.field[row][col].type === CELL_TYPE.EMPTY &&
        gameState.field[row][col].state !== CELL_STATE.OPENED
      ) {
        closedEmptyCells++;
      }
    }
  }
  if (closedEmptyCells === 0) {
    endGame(GAME_STATUS.WON);
  }
}

function endGame(result) {
  gameState.status = result;
  stopTimer();
  if (result === GAME_STATUS.LOST) {
    gameMessageElement.textContent = 'You hit a mine! Game over.';
  } else if (result === GAME_STATUS.WON) {
    gameMessageElement.textContent = 'Congratulations, you won!';
  }
  setTimeout(() => {
    gameMessageElement.textContent = '';
    initGame();
    render();
  }, 2000);
}

function initGame() {
  gameState.status = GAME_STATUS.PLAYING;
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  updateTimerDisplay();
  startTimer();
}

document.querySelector('.Button').addEventListener('click', () => {
  initGame();
  render();
});

initGame();
render();

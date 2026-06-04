const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const GAME_CONFIG = {
  rows: 10,
  cols: 10,
  minesCount: 15,
};

const gameState = {
  rows: GAME_CONFIG.rows,
  cols: GAME_CONFIG.cols,
  minesCount: GAME_CONFIG.minesCount,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
};

const boardElement = document.querySelector('#game-board');
const flagsCounterElement = document.querySelector('#flags-counter');
const timerElement = document.querySelector('#timer');
const messageElement = document.querySelector('#game-message');
const newGameButton = document.querySelector('#new-game-button');

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
    triggered: false,
  };
}

function createEmptyField(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, createCell));
}

function isInsideField(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function getNeighborPositions(row, col) {
  const positions = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;

      if (isInsideField(neighborRow, neighborCol)) {
        positions.push([neighborRow, neighborCol]);
      }
    }
  }

  return positions;
}

function getCell(row, col) {
  return gameState.field[row][col];
}

function placeMines(minesCount) {
  const minePositions = new Set();

  while (minePositions.size < minesCount) {
    const row = Math.floor(Math.random() * gameState.rows);
    const col = Math.floor(Math.random() * gameState.cols);
    minePositions.add(`${row}:${col}`);
  }

  minePositions.forEach((position) => {
    const [row, col] = position.split(':').map(Number);
    getCell(row, col).type = CELL_TYPE.MINE;
  });
}

function countNeighbourMines(row, col) {
  return getNeighborPositions(row, col).filter(([neighborRow, neighborCol]) => {
    return getCell(neighborRow, neighborCol).type === CELL_TYPE.MINE;
  }).length;
}

function countNeighborMines(row, col) {
  return countNeighbourMines(row, col);
}

function fillNeighborCounts() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = getCell(row, col);

      if (cell.type === CELL_TYPE.EMPTY) {
        cell.neighborMines = countNeighbourMines(row, col);
      }
    }
  }
}

function generateField(rows, cols, minesCount) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.field = createEmptyField(rows, cols);

  placeMines(minesCount);
  fillNeighborCounts();

  return gameState.field;
}

function getFlagsCount() {
  return gameState.field.flat().filter((cell) => cell.state === CELL_STATE.FLAGGED).length;
}

function getClosedSafeCellsCount() {
  return gameState.field.flat().filter((cell) => {
    return cell.type !== CELL_TYPE.MINE && cell.state !== CELL_STATE.OPENED;
  }).length;
}

function formatCounter(value) {
  return String(value).padStart(3, '0');
}

function startTimer() {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    if (gameState.status !== GAME_STATUS.PROCESS) {
      stopTimer();
      return;
    }

    gameState.gameTime += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function updateTimer() {
  timerElement.textContent = formatCounter(gameState.gameTime);
}

function updateFlagsCounter() {
  const flagsLeft = gameState.minesCount - getFlagsCount();
  flagsCounterElement.textContent = formatCounter(flagsLeft);
}

function updateMessage(text, statusClass = '') {
  messageElement.textContent = text;
  messageElement.classList.remove('is-win', 'is-lose');

  if (statusClass) {
    messageElement.classList.add(statusClass);
  }
}

function updateBoardStatus() {
  boardElement.dataset.status = gameState.status;
  boardElement.setAttribute('aria-disabled', String(gameState.status !== GAME_STATUS.PROCESS));
}

function checkWin() {
  if (gameState.status === GAME_STATUS.PROCESS && getClosedSafeCellsCount() === 0) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
    updateMessage('Перемога! Усі безпечні клітинки відкрито.', 'is-win');
  }
}

function revealAllMines(triggeredRow, triggeredCol) {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = getCell(row, col);

      if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
      }

      cell.triggered = row === triggeredRow && col === triggeredCol;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideField(row, col)) {
    return;
  }

  const cell = getCell(row, col);

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  startTimer();

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOSE;
    revealAllMines(row, col);
    stopTimer();
    updateMessage('Поразка. Ви натиснули на міну.', 'is-lose');
    renderGame();
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    getNeighborPositions(row, col).forEach(([neighborRow, neighborCol]) => {
      openCell(neighborRow, neighborCol);
    });
  }

  checkWin();
  renderGame();
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS || !isInsideField(row, col)) {
    return;
  }

  const cell = getCell(row, col);

  if (cell.state === CELL_STATE.OPENED) {
    return;
  }

  startTimer();
  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
  renderGame();
}

function getCellClasses(cell) {
  const classes = ['cell'];

  if (cell.state === CELL_STATE.CLOSED) {
    classes.push('is-closed');
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    classes.push('is-flagged');
  }

  if (cell.state === CELL_STATE.OPENED) {
    if (cell.type === CELL_TYPE.MINE) {
      classes.push('is-mine');

      if (cell.triggered) {
        classes.push('is-triggered');
      }
    } else {
      classes.push('is-open');

      if (cell.neighborMines > 0) {
        classes.push(`number-${cell.neighborMines}`);
      }
    }
  }

  return classes.join(' ');
}

function getCellText(cell) {
  if (cell.state === CELL_STATE.FLAGGED) {
    return '⚑';
  }

  if (cell.state === CELL_STATE.OPENED && cell.type === CELL_TYPE.MINE) {
    return '✹';
  }

  if (cell.state === CELL_STATE.OPENED && cell.neighborMines > 0) {
    return String(cell.neighborMines);
  }

  return '';
}

function getCellLabel(row, col, cell) {
  if (cell.state === CELL_STATE.FLAGGED) {
    return `Клітинка ${row + 1}, ${col + 1}: прапорець`;
  }

  if (cell.state === CELL_STATE.CLOSED) {
    return `Клітинка ${row + 1}, ${col + 1}: закрита`;
  }

  if (cell.type === CELL_TYPE.MINE) {
    return `Клітинка ${row + 1}, ${col + 1}: міна`;
  }

  if (cell.neighborMines === 0) {
    return `Клітинка ${row + 1}, ${col + 1}: відкрита порожня`;
  }

  return `Клітинка ${row + 1}, ${col + 1}: ${cell.neighborMines} мін поруч`;
}

function createCellButton(row, col, cell) {
  const cellButton = document.createElement('button');
  cellButton.type = 'button';
  cellButton.className = getCellClasses(cell);
  cellButton.textContent = getCellText(cell);
  cellButton.dataset.row = String(row);
  cellButton.dataset.col = String(col);
  cellButton.setAttribute('role', 'gridcell');
  cellButton.setAttribute('aria-label', getCellLabel(row, col, cell));
  cellButton.disabled = gameState.status !== GAME_STATUS.PROCESS;

  return cellButton;
}

function renderField() {
  boardElement.style.setProperty('--board-cols', gameState.cols);
  boardElement.innerHTML = '';

  gameState.field.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      boardElement.append(createCellButton(row, col, cell));
    });
  });
}

function renderGame() {
  updateTimer();
  updateFlagsCounter();
  updateBoardStatus();
  renderField();
}

function getCellPositionFromEvent(event) {
  const cellButton = event.target.closest('.cell');

  if (!cellButton || !boardElement.contains(cellButton)) {
    return null;
  }

  return {
    row: Number(cellButton.dataset.row),
    col: Number(cellButton.dataset.col),
  };
}

function handleBoardClick(event) {
  const position = getCellPositionFromEvent(event);

  if (position) {
    openCell(position.row, position.col);
  }
}

function handleBoardContextMenu(event) {
  event.preventDefault();

  const position = getCellPositionFromEvent(event);

  if (position) {
    toggleFlag(position.row, position.col);
  }
}

function resetGame() {
  stopTimer();
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  generateField(GAME_CONFIG.rows, GAME_CONFIG.cols, GAME_CONFIG.minesCount);
  updateMessage('Гру почато. Відкрийте першу клітинку.');
  renderGame();
}

boardElement.addEventListener('click', handleBoardClick);
boardElement.addEventListener('contextmenu', handleBoardContextMenu);
newGameButton.addEventListener('click', resetGame);

resetGame();

window.minesweeperGame = {
  CELL_STATE,
  CELL_TYPE,
  GAME_STATUS,
  gameState,
  get field() {
    return gameState.field;
  },
  generateField,
  countNeighbourMines,
  countNeighborMines,
  openCell,
  toggleFlag,
  renderField,
  resetGame,
};

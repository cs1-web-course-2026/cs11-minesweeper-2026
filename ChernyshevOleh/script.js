const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
};

let field = [];

const boardElement = document.querySelector('#game-board');
const flagsCounterElement = document.querySelector('#flags-counter');
const timerElement = document.querySelector('#timer');
const messageElement = document.querySelector('#game-message');
const newGameButton = document.querySelector('#new-game-button');

function createCell() {
  return {
    type: 'empty',
    neighborMines: 0,
    state: 'closed',
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

function placeMines(minesCount) {
  const minePositions = new Set();

  while (minePositions.size < minesCount) {
    const row = Math.floor(Math.random() * gameState.rows);
    const col = Math.floor(Math.random() * gameState.cols);
    minePositions.add(`${row}:${col}`);
  }

  minePositions.forEach((position) => {
    const [row, col] = position.split(':').map(Number);
    field[row][col].type = 'mine';
  });
}

function countNeighbourMines(row, col) {
  return getNeighborPositions(row, col).filter(([neighborRow, neighborCol]) => {
    return field[neighborRow][neighborCol].type === 'mine';
  }).length;
}

function countNeighborMines(row, col) {
  return countNeighbourMines(row, col);
}

function fillNeighborCounts() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      if (field[row][col].type === 'empty') {
        field[row][col].neighborMines = countNeighbourMines(row, col);
      }
    }
  }
}

function generateField(rows, cols, minesCount) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;

  field = createEmptyField(rows, cols);
  placeMines(minesCount);
  fillNeighborCounts();

  return field;
}

function getFlagsCount() {
  return field.flat().filter((cell) => cell.state === 'flagged').length;
}

function getClosedSafeCellsCount() {
  return field.flat().filter((cell) => {
    return cell.type !== 'mine' && cell.state !== 'opened';
  }).length;
}

function startTimer() {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    if (gameState.status !== 'process') {
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
  timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
}

function updateFlagsCounter() {
  const flagsLeft = gameState.minesCount - getFlagsCount();
  flagsCounterElement.textContent = String(flagsLeft).padStart(3, '0');
}

function updateMessage(text, statusClass = '') {
  messageElement.textContent = text;
  messageElement.classList.remove('is-win', 'is-lose');

  if (statusClass) {
    messageElement.classList.add(statusClass);
  }
}

function checkWin() {
  if (gameState.status === 'process' && getClosedSafeCellsCount() === 0) {
    gameState.status = 'win';
    stopTimer();
    updateMessage('Перемога! Усі безпечні клітинки відкрито.', 'is-win');
  }
}

function revealAllMines(triggeredRow, triggeredCol) {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = field[row][col];

      if (cell.type === 'mine') {
        cell.state = 'opened';
      }

      if (row === triggeredRow && col === triggeredCol) {
        cell.triggered = true;
      }
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== 'process' || !isInsideField(row, col)) {
    return;
  }

  const cell = field[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') {
    return;
  }

  startTimer();

  if (cell.type === 'mine') {
    cell.state = 'opened';
    gameState.status = 'lose';
    revealAllMines(row, col);
    stopTimer();
    updateMessage('Поразка. Ви натиснули на міну.', 'is-lose');
    renderField();
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    getNeighborPositions(row, col).forEach(([neighborRow, neighborCol]) => {
      openCell(neighborRow, neighborCol);
    });
  }

  checkWin();
  renderField();
}

function toggleFlag(row, col) {
  if (gameState.status !== 'process' || !isInsideField(row, col)) {
    return;
  }

  const cell = field[row][col];

  if (cell.state === 'opened') {
    return;
  }

  startTimer();
  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
  updateFlagsCounter();
  renderField();
}

function getCellClasses(cell) {
  const classes = ['cell'];

  if (cell.state === 'closed') {
    classes.push('is-closed');
  }

  if (cell.state === 'flagged') {
    classes.push('is-flagged');
  }

  if (cell.state === 'opened') {
    if (cell.type === 'mine') {
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
  if (cell.state === 'flagged') {
    return '⚑';
  }

  if (cell.state === 'opened' && cell.type === 'mine') {
    return '✹';
  }

  if (cell.state === 'opened' && cell.neighborMines > 0) {
    return String(cell.neighborMines);
  }

  return '';
}

function getCellLabel(row, col, cell) {
  if (cell.state === 'flagged') {
    return `Клітинка ${row + 1}, ${col + 1}: прапорець`;
  }

  if (cell.state === 'closed') {
    return `Клітинка ${row + 1}, ${col + 1}: закрита`;
  }

  if (cell.type === 'mine') {
    return `Клітинка ${row + 1}, ${col + 1}: міна`;
  }

  if (cell.neighborMines === 0) {
    return `Клітинка ${row + 1}, ${col + 1}: відкрита порожня`;
  }

  return `Клітинка ${row + 1}, ${col + 1}: ${cell.neighborMines} мін поруч`;
}

function renderField() {
  boardElement.style.setProperty('--board-cols', gameState.cols);
  boardElement.innerHTML = '';

  field.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      const cellButton = document.createElement('button');
      cellButton.type = 'button';
      cellButton.className = getCellClasses(cell);
      cellButton.textContent = getCellText(cell);
      cellButton.setAttribute('role', 'gridcell');
      cellButton.setAttribute('aria-label', getCellLabel(row, col, cell));
      cellButton.disabled = gameState.status !== 'process';

      cellButton.addEventListener('click', () => openCell(row, col));
      cellButton.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      boardElement.append(cellButton);
    });
  });
}

function resetGame() {
  stopTimer();
  gameState.status = 'process';
  gameState.gameTime = 0;
  generateField(10, 10, 15);
  updateTimer();
  updateFlagsCounter();
  updateMessage('Гру почато. Відкрийте першу клітинку.');
  renderField();
}

newGameButton.addEventListener('click', resetGame);

resetGame();

window.minesweeperGame = {
  gameState,
  get field() {
    return field;
  },
  generateField,
  countNeighbourMines,
  countNeighborMines,
  openCell,
  toggleFlag,
  resetGame,
};

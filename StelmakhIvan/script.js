// DOM-елементи
const gameFieldElement = document.querySelector('.game-field');
const timerElement = document.querySelector('.timer');
const flagCounterElement = document.querySelector('.flag-counter');
const messageElement = document.querySelector('.game-message');
const startButton = document.querySelector('.start-btn');

// стан гри
const CELL_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  flagsPlaced: 0,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
};

// масив поля
let field = [];

function initGame() {
  gameState.status = GAME_STATUS.PLAYING;
  gameState.flagsPlaced = 0;

  flagCounterElement.textContent = `0/${gameState.minesCount}`;
  messageElement.textContent = '';
  messageElement.className = 'game-message';
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  countNeighbourMines(field);
  renderBoard();
  startTimer();
}

// таймер
function startTimer() {
  gameState.gameTime = 0;
  timerElement.textContent = gameState.gameTime;

  if (gameState.timerId) {
    clearInterval(gameState.timerId);
  }

  gameState.timerId = setInterval(() => {
    if (gameState.status === GAME_STATUS.PLAYING) {
      gameState.gameTime++;
      timerElement.textContent = gameState.gameTime;
    }
  }, 1000);
}

// розстановка мін
function generateField(rows, cols, minesCount) {
  let minesArray = [];

  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0,
      });
    }
    minesArray.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    if (minesArray[randomRow][randomCol].type !== 'mine') {
      minesArray[randomRow][randomCol].type = 'mine';
      minesPlaced++;
    }
  }
  return minesArray;
}

// підрахунок сусідів для кожної клітинки
function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].type === CELL_CONTENT.MINE) continue;
      let neighbourCount = 0;

      for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
          const neighbourRow = row + directionalRow;
          const neighbourCol = col + directionalCol;

          if (
            neighbourRow >= 0 &&
            neighbourRow < gameState.rows &&
            neighbourCol >= 0 &&
            neighbourCol < gameState.cols &&
            field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE
          ) {
            neighbourCount++;
          }
        }
      }

      field[row][col].neighborMines = neighbourCount;
    }
  }
}

// логіка взаємодії
function openCell(row, col, isRootCall = true) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;

  const cell = field[row][col];
  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED)
    return;

  cell.state = CELL_STATE.OPEN;

  if (cell.type === CELL_CONTENT.MINE) {
    gameState.status = GAME_STATUS.LOST;

    clearInterval(gameState.timerId);

    messageElement.textContent = 'Kaboom!💥';
    messageElement.className = 'game-message loss';

    cell.isClickedMine = true;

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const currentCell = field[r][c];

        if (
          currentCell.type === CELL_CONTENT.MINE &&
          currentCell.state !== CELL_STATE.FLAGGED
        ) {
          currentCell.state = CELL_STATE.OPEN;
        } else if (
          currentCell.type !== CELL_CONTENT.MINE &&
          currentCell.state === CELL_STATE.FLAGGED
        ) {
          currentCell.state = CELL_STATE.OPEN;
          currentCell.wrongFlag = true;
        }
      }
    }

    if (isRootCall) renderBoard();
    return;
  }

  if (cell.neighborMines === 0) {
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
      for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
        if (directionalRow === 0 && directionalCol === 0) continue;
        openCell(row + directionalRow, col + directionalCol);
      }
    }
  }

  if (isRootCall) {
    checkWin();
    renderBoard();
  }
}

// прапорці
function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPEN) return;

  if (cell.state === CELL_STATE.CLOSED) {
    if (gameState.flagsPlaced >= gameState.minesCount) return;

    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsPlaced++;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsPlaced--;
  }

  flagCounterElement.textContent = `${gameState.flagsPlaced}/${gameState.minesCount}`;

  renderBoard();
}

// відмальовка поля
function renderBoard() {
  gameFieldElement.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellData = field[r][c];

      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');

      if (cellData.state === CELL_STATE.CLOSED) {
        cellElement.classList.add('closed');
      } else if (cellData.state === CELL_STATE.FLAGGED) {
        cellElement.classList.add('closed', 'flagged');
        cellElement.textContent = '🚩';

        if (gameState.status === 'lose' && cellData.type === 'mine') {
          cellElement.classList.add('mine');
        }
      } else if (cellData.state === CELL_STATE.OPEN) {
        cellElement.classList.add('revealed');

        if (cellData.wrongFlag) {
          cellElement.classList.add('flagged');
          cellElement.textContent = '❌';
        }

        if (cellData.type === 'mine') {
          cellElement.classList.add('mine');
          cellElement.textContent = '💣';

          if (cellData.isClickedMine) {
            cellElement.classList.add('clicked');
          }
        } else if (cellData.neighborMines > 0) {
          cellElement.classList.add(`number-${cellData.neighborMines}`);
          cellElement.textContent = cellData.neighborMines;
        }
      }

      cellElement.addEventListener('click', () => {
        openCell(r, c);
      });

      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });
      gameFieldElement.appendChild(cellElement);
    }
  }
}

//перемога
function checkWin() {
  let openedCellsCount = 0;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (field[r][c].state === CELL_STATE.OPEN) {
        openedCellsCount++;
      }
    }
  }

  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;

  if (openedCellsCount === totalSafeCells) {
    gameState.status = GAME_STATUS.WON;

    clearInterval(gameState.timerId);

    const overlay = document.getElementById('win-overlay');
    overlay.style.display = 'flex';

    messageElement.textContent = '🎉 Перемога! Ви професійний сапер 🎉';
    messageElement.className = 'game-message win';

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        if (field[r][c].type === 'mine' && field[r][c].state !== 'flagged') {
          field[r][c].state = 'flagged';
          gameState.flagsPlaced++;
        }
      }
    }
    flagCounterElement.textContent = `${gameState.flagsPlaced}/${gameState.minesCount}`;
  }
}

document.querySelector('.close-overlay-btn').addEventListener('click', () => {
  document.getElementById('win-overlay').style.display = 'none';
});

// Запуск гри
startButton.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);

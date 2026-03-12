// DOM-елементи
const gameFieldElement = document.querySelector('.game-field');
const timerElement = document.querySelector('.timer');
const flagCounterElement = document.querySelector('.flag-counter');
const messageElement = document.querySelector('.game-message');
const startBtn = document.querySelector('.start-btn');

// стан гри
const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  flagsPlaced: 0,
  status: 'process',
  gameTime: 0,
  timerId: null,
};

// масив поля
let field = [];

function initGame() {
  gameState.status = 'process';
  gameState.flagsPlaced = 0;

  flagCounterElement.textContent = `0/${gameState.minesCount}`;
  messageElement.textContent = '';
  messageElement.className = 'game-message';
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  countNeighbourMines();
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
    if (gameState.status === 'process') {
      gameState.gameTime++;
      timerElement.textContent = gameState.gameTime;
    }
  }, 1000);
}

// розстановка мін
function generateField(rows, cols, neighborCounter) {
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
  while (minesPlaced < neighborCounter) {
    let randRow = Math.floor(Math.random() * rows);
    let randCol = Math.floor(Math.random() * cols);

    if (minesArray[randRow][randCol].type !== 'mine') {
      minesArray[randRow][randCol].type = 'mine';
      minesPlaced++;
    }
  }
  return minesArray;
}

// підрахунок сусідів для кожної клітинки
function countNeighbourMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (field[r][c].type === 'mine') {
        continue;
      }

      let neighborCounter = 0;

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          let neighborRow = r + i;
          let neighborCol = c + j;

          if (
            neighborRow >= 0 &&
            neighborRow < gameState.rows &&
            neighborCol >= 0 &&
            neighborCol < gameState.cols
          ) {
            if (field[neighborRow][neighborCol].type === 'mine') {
              neighborCounter++;
            }
          }
        }
      }
      field[r][c].neighborMines = neighborCounter;
    }
  }
}

// логіка взаємодії
function openCell(row, col) {
  if (gameState.status !== 'process') return;
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;

  const cell = field[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';

    clearInterval(gameState.timerId);

    messageElement.textContent = 'Kaboom!💥';
    messageElement.className = 'game-message loss';

    cell.isClickedMine = true;

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        const currentCell = field[r][c];

        if (currentCell.type === 'mine' && currentCell.state !== 'flagged') {
          currentCell.state = 'opened';
        } else if (
          currentCell.type !== 'mine' &&
          currentCell.state === 'flagged'
        ) {
          currentCell.state = 'opened';
          currentCell.wrongFlag = true;
        }
      }
    }

    renderBoard();
    return;
  }

  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        openCell(row + i, col + j);
      }
    }
  }

  if (gameState.status === 'process') {
    checkWin();
  }

  renderBoard();
}

// прапорці
function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;

  const cell = field[row][col];

  if (cell.state === 'opened') return;

  if (cell.state === 'closed') {
    if (gameState.flagsPlaced >= gameState.minesCount) return;

    cell.state = 'flagged';
    gameState.flagsPlaced++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
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

      const cellEl = document.createElement('div');
      cellEl.classList.add('cell');

      if (cellData.state === 'closed') {
        cellEl.classList.add('closed');
      } else if (cellData.state === 'flagged') {
        cellEl.classList.add('closed', 'flagged');
        cellEl.textContent = '🚩';

        if (gameState.status === 'lose' && cellData.type === 'mine') {
          cellEl.classList.add('mine');
        }
      } else if (cellData.state === 'opened') {
        cellEl.classList.add('revealed');

        if (cellData.wrongFlag) {
          cellEl.classList.add('flagged');
          cellEl.textContent = '❌';
        }

        if (cellData.type === 'mine') {
          cellEl.classList.add('mine');
          cellEl.textContent = '💣';

          if (cellData.isClickedMine) {
            cellEl.classList.add('clicked');
          }
        } else if (cellData.neighborMines > 0) {
          cellEl.classList.add(`number-${cellData.neighborMines}`);
          cellEl.textContent = cellData.neighborMines;
        }
      }

      cellEl.addEventListener('click', () => {
        openCell(r, c);
      });

      cellEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      });
      gameFieldElement.appendChild(cellEl);
    }
  }
}

//перемога
function checkWin() {
  let openedCellsCount = 0;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (field[r][c].state === 'opened') {
        openedCellsCount++;
      }
    }
  }

  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;

  if (openedCellsCount === totalSafeCells) {
    gameState.status = 'win';

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
startBtn.addEventListener('click', initGame);
document.addEventListener('DOMContentLoaded', initGame);

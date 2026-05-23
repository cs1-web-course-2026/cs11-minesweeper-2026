const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: [],
  flagsPlaced: 0
};

function generateField(rows, cols, minesCount) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.flagsPlaced = 0;
  gameState.field = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ type: 'empty', state: 'closed', neighborMines: 0 });
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
  updateCounters();
  renderDOMField();
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
          const nRow = r + dr, nCol = c + dc;
          if (nRow >= 0 && nRow < rows && nCol >= 0 && nCol < cols) {
            if (gameState.field[nRow][nCol].type === 'mine') count++;
          }
        }
      }
      gameState.field[r][c].neighborMines = count;
    }
  }
}

function renderDOMField() {
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellData = gameState.field[r][c];
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.dataset.row = r;
      cellElement.dataset.col = c;

      if (cellData.state === 'opened') {
        cellElement.classList.add('opened');
        if (cellData.type === 'mine') {
          cellElement.classList.add('mine');
          cellElement.innerText = '💣';
        } else if (cellData.neighborMines > 0) {
          cellElement.innerText = cellData.neighborMines;
          cellElement.classList.add(`c${cellData.neighborMines}`);
        }
      } else if (cellData.state === 'flagged') {
        cellElement.classList.add('flagged');
        cellElement.innerText = '🚩';
      }

      cellElement.addEventListener('click', (e) => {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        openCell(row, col);
      });

      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        handleRightClick(row, col);
      });

      gridElement.appendChild(cellElement);
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== 'process') return;
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    revealAllMines();
    endGame('lose');
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nRow = row + dr, nCol = col + dc;
        if (nRow >= 0 && nRow < gameState.rows && nCol >= 0 && nCol < gameState.cols) {
          openCell(nRow, nCol);
        }
      }
    }
  }

  checkWinCondition();
  renderDOMField();
}

function handleRightClick(row, col) {
  if (gameState.status !== 'process') return;
  const cell = gameState.field[row][col];
  if (cell.state === 'opened') return;

  if (cell.state === 'closed') {
    cell.state = 'flagged';
    gameState.flagsPlaced++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsPlaced--;
  }

  updateCounters();
  renderDOMField();
}

function revealAllMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'mine') {
        gameState.field[r][c].state = 'opened';
      }
    }
  }
}

function updateCounters() {
  const remainingMines = gameState.minesCount - gameState.flagsPlaced;
  document.getElementById('mines-counter').innerText = String(Math.max(0, remainingMines)).padStart(3, '0');
  document.getElementById('timer').innerText = String(gameState.gameTime).padStart(3, '0');
}

function startTimer() {
  if (gameState.timerId) clearInterval(gameState.timerId);
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    document.getElementById('timer').innerText = String(gameState.gameTime).padStart(3, '0');
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
  if (allSafeCellsOpened) endGame('win');
}

function endGame(finalStatus) {
  gameState.status = finalStatus;
  clearInterval(gameState.timerId);
  const btn = document.getElementById('restart-btn');
  btn.innerText = finalStatus === 'win' ? '😎' : '😵';
  alert(finalStatus === 'win' ? 'Вітаємо! Ви перемогли! 🎉' : 'Гра закінчена! Ви підірвалися на міні. 💣');
}

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('restart-btn').innerText = '🙂';
  generateField(10, 10, 15);
});

generateField(10, 10, 15);


const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', 
  gameTime: 0,
  timerId: null,
};

let field = [];



function generateField(rows, cols, minesCount) {
  const newField = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: 'empty',
      state: 'closed',
      neighborMines: 0,
    }))
  );

  let placed = 0;
  while (placed < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (newField[row][col].type !== 'mine') {
      newField[row][col].type = 'mine';
      placed++;
    }
  }

  return newField;
}



function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c].type === 'mine') continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (field[nr][nc].type === 'mine') count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}


function openCell(row, col) {
  const cell = field[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    gameState.status = 'lose';
    stopTimer();
    revealAllMines(row, col);
    renderField();
    showStatus();
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          if (field[nr][nc].state === 'closed') {
            openCell(nr, nc);
          }
        }
      }
    }
  }

  checkWin();
}


function toggleFlag(row, col) {
  const cell = field[row][col];
  if (cell.state === 'opened') return;

  if (cell.state === 'flagged') {
    cell.state = 'closed';
  } else {
    cell.state = 'flagged';
  }
}


function checkWin() {
  const allSafeCellsOpen = field.every(row =>
    row.every(cell => cell.type === 'mine' || cell.state === 'opened')
  );

  if (allSafeCellsOpen) {
    gameState.status = 'win';
    stopTimer();
    renderField();
    showStatus();
  }
}


function revealAllMines(hitRow, hitCol) {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = field[r][c];
      if (cell.type === 'mine' && cell.state !== 'flagged') {
        cell.state = 'opened';
        cell._isHit = (r === hitRow && c === hitCol);
      }
    }
  }
}


function startTimer() {
  gameState.gameTime = 0;
  updateTimerUI();

  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}


function updateTimerUI() {
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = gameState.gameTime;
}

function updateMinesCountUI() {
  const minesEl = document.getElementById('mines-count');
  if (minesEl) {
    let flagCount = 0;
    for (const row of field) {
      for (const cell of row) {
        if (cell.state === 'flagged') flagCount++;
      }
    }
    minesEl.textContent = gameState.minesCount - flagCount;
  }
}

function showStatus() {
  const statusEl = document.getElementById('game-status');
  if (!statusEl) return;

  if (gameState.status === 'win') {
    statusEl.textContent = '🎉 Перемога! Час: ' + gameState.gameTime + ' сек';
    statusEl.className = 'game-status game-status--win';
  } else if (gameState.status === 'lose') {
    statusEl.textContent = '💥 Програш! Спробуй ще раз';
    statusEl.className = 'game-status game-status--lose';
  } else {
    statusEl.textContent = '';
    statusEl.className = 'game-status';
  }
}


function renderField() {
  const board = document.getElementById('board');
  if (!board) return;

  board.style.gridTemplateColumns = `repeat(${gameState.cols}, var(--cell-size))`;

  board.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellData = field[r][c];
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;

      switch (cellData.state) {
        case 'closed':
          cellEl.classList.add('cell--closed');
          break;

        case 'flagged':
          cellEl.classList.add('cell--flagged');
          cellEl.textContent = '🚩';
          break;

        case 'opened':
          if (cellData.type === 'mine') {
            cellEl.classList.add('cell--mine');
            cellEl.textContent = '💣';
            if (cellData._isHit) {
              cellEl.classList.add('cell--mine--hit');
            }
          } else {
            cellEl.classList.add('cell--opened');
            if (cellData.neighborMines > 0) {
              cellEl.classList.add('cell--number');
              cellEl.dataset.number = cellData.neighborMines;
              cellEl.textContent = cellData.neighborMines;
            }
          }
          break;
      }

      if (gameState.status === 'process') {
        cellEl.addEventListener('click', handleLeftClick);

        cellEl.addEventListener('contextmenu', handleRightClick);
      }

      board.appendChild(cellEl);
    }
  }

  updateMinesCountUI();
}

function handleLeftClick(event) {
  if (gameState.status !== 'process') return;

  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);

  openCell(row, col);

  if (gameState.status === 'process') {
    renderField();
  }
}

function handleRightClick(event) {
  event.preventDefault();

  if (gameState.status !== 'process') return;

  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);

  toggleFlag(row, col);
  renderField();
}


function initGame() {
  gameState.rows = 10;
  gameState.cols = 10;
  gameState.minesCount = 15;
  gameState.status = 'process';
  gameState.gameTime = 0;

  stopTimer();

  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(field);

  renderField();
  showStatus();
  startTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', initGame);
  }

  initGame();
});

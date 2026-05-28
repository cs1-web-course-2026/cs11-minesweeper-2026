
// ============================================================
// 1. КОНСТАНТИ (enum-стиль)
// ============================================================

const CELL_TYPE = Object.freeze({
  MINE: 'mine',
  EMPTY: 'empty',
});

const CELL_STATE = Object.freeze({
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
});

const GAME_STATUS = Object.freeze({
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
});

// ============================================================
// 2. СТРУКТУРИ ДАНИХ
// ============================================================

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
};

// Кешовані DOM-посилання ( DOMContentLoaded)
// Джерело: MDN — getElementById
let timerElement = null;
let minesCountElement = null;
let gameStatusElement = null;
let boardElement = null;

// ============================================================
// 3. ГЕНЕРАЦІЯ ПОЛЯ
// Джерело: MDN — Math.random(), Array.from()
// ============================================================

function generateField(rows, cols, minesCount) {
  const newField = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: CELL_TYPE.EMPTY,
      state: CELL_STATE.CLOSED,
      neighborMines: 0,
    }))
  );

  let placed = 0;
  while (placed < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (newField[row][col].type !== CELL_TYPE.MINE) {
      newField[row][col].type = CELL_TYPE.MINE;
      placed++;
    }
  }

  return newField;
}

// ============================================================
// 4. ПІДРАХУНОК СУСІДІВ
// ============================================================

function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CELL_TYPE.MINE) continue;

      let count = 0;
      for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
          if (directionalRow === 0 && directionalCol === 0) continue;
          const neighbourRow = row + directionalRow;
          const neighbourCol = col + directionalCol;
          if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
            if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) count++;
          }
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}

// ============================================================
// 5. ЛОГІКА ВІДКРИТТЯ (рекурсія)
// Джерело: MDN — Recursion
// ============================================================

function openCell(row, col) {
  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    revealAllMines(row, col);
    renderField();
    showStatus();
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
      for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
        if (directionalRow === 0 && directionalCol === 0) continue;
        const neighbourRow = row + directionalRow;
        const neighbourCol = col + directionalCol;
        if (
          neighbourRow >= 0 && neighbourRow < gameState.rows &&
          neighbourCol >= 0 && neighbourCol < gameState.cols
        ) {
          if (gameState.field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
            openCell(neighbourRow, neighbourCol);
          }
        }
      }
    }
  }

  checkWin();
}

// ============================================================
// 6. ПРАПОРЦІ
// ============================================================

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED) return;

  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}

// ============================================================
// 7. ПЕРЕВІРКА ПЕРЕМОГИ
// ============================================================

function checkWin() {
  const allSafeCellsOpen = gameState.field.every(rowArr =>
    rowArr.every(cell => cell.type === CELL_TYPE.MINE || cell.state === CELL_STATE.OPENED)
  );

  if (allSafeCellsOpen) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
    renderField();
    showStatus();
  }
}

// ============================================================
// 8. ВІДКРИТТЯ ВСІХ МІН ПІСЛЯ ПРОГРАШУ
// ============================================================

function revealAllMines(hitRow, hitCol) {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.OPENED;
        cell._isHit = (row === hitRow && col === hitCol);
      }
    }
  }
}

// ============================================================
// 9. ТАЙМЕР
// Джерело: MDN — setInterval, clearInterval
// ============================================================

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

// ============================================================
// 10. DOM — ОНОВЛЕННЯ ІНТЕРФЕЙСУ
// Джерело: MDN — textContent
// ============================================================

function updateTimerUI() {
  if (timerElement) timerElement.textContent = gameState.gameTime;
}

function updateMinesCountUI() {
  if (!minesCountElement) return;
  let flagCount = 0;
  for (const row of gameState.field) {
    for (const cell of row) {
      if (cell.state === CELL_STATE.FLAGGED) flagCount++;
    }
  }
  minesCountElement.textContent = gameState.minesCount - flagCount;
}

function showStatus() {
  if (!gameStatusElement) return;

  if (gameState.status === GAME_STATUS.WIN) {
    gameStatusElement.textContent = '🎉 Перемога! Час: ' + gameState.gameTime + ' сек';
    gameStatusElement.className = 'game-status game-status--win';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    gameStatusElement.textContent = '💥 Програш! Спробуй ще раз';
    gameStatusElement.className = 'game-status game-status--lose';
  } else {
    gameStatusElement.textContent = '';
    gameStatusElement.className = 'game-status';
  }
}

// ============================================================
// 11. DOM — РЕНДЕРИНГ ІГРОВОГО ПОЛЯ
// Джерело: MDN — createElement, classList, dataset, addEventListener
// ============================================================

function renderField() {
  if (!boardElement) return;

  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, var(--cell-size))`;
  boardElement.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellData = gameState.field[row][col];

      const cellEl = document.createElement('button');
      cellEl.type = 'button';
      cellEl.className = 'cell';
      cellEl.dataset.row = row;
      cellEl.dataset.col = col;
      cellEl.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${cellData.state}`);

      switch (cellData.state) {
        case CELL_STATE.CLOSED:
          cellEl.classList.add('cell--closed');
          break;

        case CELL_STATE.FLAGGED:
          cellEl.classList.add('cell--flagged');
          cellEl.textContent = '🚩';
          break;

        case CELL_STATE.OPENED:
          if (cellData.type === CELL_TYPE.MINE) {
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

      if (gameState.status === GAME_STATUS.PROCESS) {
        cellEl.addEventListener('click', handleLeftClick);
        cellEl.addEventListener('contextmenu', handleRightClick);
      }

      boardElement.appendChild(cellEl);
    }
  }

  updateMinesCountUI();
}

// ============================================================
// 12. ОБРОБНИКИ ПОДІЙ МИШІ
// Джерело: MDN — MouseEvent, event.preventDefault()
// ============================================================

function handleLeftClick(event) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);

  openCell(row, col);

  if (gameState.status === GAME_STATUS.PROCESS) {
    renderField();
  }
}

function handleRightClick(event) {
  event.preventDefault();

  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const row = parseInt(event.currentTarget.dataset.row);
  const col = parseInt(event.currentTarget.dataset.col);

  toggleFlag(row, col);
  renderField();
}

// ============================================================
// 13. ІНІЦІАЛІЗАЦІЯ ГРИ
// ============================================================

function initGame() {
  gameState.rows = 10;
  gameState.cols = 10;
  gameState.minesCount = 15;
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;

  stopTimer();

  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);

  renderField();
  showStatus();
  startTimer();
}

// ============================================================
// 14. КНОПКА НОВОЇ ГРИ
// Джерело: MDN — DOMContentLoaded, querySelector
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Кешуємо DOM-посилання один раз
  timerElement = document.getElementById('timer');
  minesCountElement = document.getElementById('mines-count');
  gameStatusElement = document.getElementById('game-status');
  boardElement = document.getElementById('board');

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', initGame);
  }

  initGame();
});

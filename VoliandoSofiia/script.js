// ========== СТАН ГРИ ==========
const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

let gameState = {
  rows: 11,
  cols: 11,
  totalMines: 12,
  board: [],
  status: GAME_STATUS.IDLE,
  firstClick: true,
  flagsPlaced: 0,
  cellsRevealed: 0,
  timerId: null,
  seconds: 0,
};

// ========== DOM ЕЛЕМЕНТИ ==========
const boardEl = document.getElementById('board');
const minesCountEl = document.getElementById('minesCount');
const timerEl = document.getElementById('timer');
const newGameBtn = document.getElementById('newGameBtn');
const messageEl = document.getElementById('game-message');

// ========== ДОПОМІЖНІ ФУНКЦІЇ ==========
function updateMinesDisplay() {
  const remaining = gameState.totalMines - gameState.flagsPlaced;
  minesCountEl.textContent = String(remaining).padStart(3, '0');
}

function updateTimerDisplay() {
  timerEl.textContent = String(gameState.seconds).padStart(3, '0');
}

function stopTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function startTimer() {
  if (gameState.timerId) stopTimer();
  gameState.timerId = setInterval(() => {
    if (gameState.status === GAME_STATUS.PLAYING) {
      gameState.seconds++;
      updateTimerDisplay();
    }
  }, 1000);
}

// ========== СТВОРЕННЯ ПОЛЯ ==========
function createEmptyBoard() {
  const newBoard = [];
  for (let r = 0; r < gameState.rows; r++) {
    newBoard[r] = [];
    for (let c = 0; c < gameState.cols; c++) {
      newBoard[r][c] = {
        mine: false,
        revealed: false,
        flagged: false,
        neighborMines: 0,
      };
    }
  }
  return newBoard;
}

function placeMines(firstRow, firstCol) {
  let placed = 0;
  while (placed < gameState.totalMines) {
    const row = Math.floor(Math.random() * gameState.rows);
    const col = Math.floor(Math.random() * gameState.cols);

    const isFirstArea =
      Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;

    if (!gameState.board[row][col].mine && !isFirstArea) {
      gameState.board[row][col].mine = true;
      placed++;
    }
  }
}

function countNeighbors() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.board[r][c].mine) continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < gameState.rows &&
            nc >= 0 &&
            nc < gameState.cols
          ) {
            if (gameState.board[nr][nc].mine) count++;
          }
        }
      }
      gameState.board[r][c].neighborMines = count;
    }
  }
}

// ========== РЕКУРСИВНЕ ВІДКРИТТЯ ==========
function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;

  const cell = gameState.board[row][col];
  if (cell.revealed) return;
  if (cell.flagged) return;

  cell.revealed = true;
  gameState.cellsRevealed++;

  if (cell.neighborMines === 0 && !cell.mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        openCell(row + dr, col + dc);
      }
    }
  }
}

// ========== ПРАПОРЦІ ==========
function toggleFlag(row, col) {
  const cell = gameState.board[row][col];
  if (cell.revealed) return;

  if (!cell.flagged) {
    if (gameState.flagsPlaced < gameState.totalMines) {
      cell.flagged = true;
      gameState.flagsPlaced++;
    }
  } else {
    cell.flagged = false;
    gameState.flagsPlaced--;
  }

  updateMinesDisplay();
  renderBoard();
  checkWin();
}

// ========== ПЕРЕВІРКА ПЕРЕМОГИ ==========
function checkWin() {
  let allOpen = true;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.board[r][c];
      if (!cell.mine && !cell.revealed) {
        allOpen = false;
        break;
      }
    }
  }

  if (allOpen) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    messageEl.textContent = '🎉 Вітаю! Ви перемогли! 🎉';
    renderBoard();
  }
}

// ========== ОБРОБКА КЛІКІВ ==========
function handleClick(row, col) {
  if (
    gameState.status !== GAME_STATUS.PLAYING &&
    gameState.status !== GAME_STATUS.IDLE
  )
    return;

  const cell = gameState.board[row][col];
  if (cell.flagged) return;

  if (gameState.status === GAME_STATUS.IDLE) {
    gameState.status = GAME_STATUS.PLAYING;
    placeMines(row, col);
    countNeighbors();
    startTimer();
  }

  if (cell.mine) {
    cell.revealed = true;
    gameState.status = GAME_STATUS.LOST;
    stopTimer();

    for (let r = 0; r < gameState.rows; r++) {
      for (let c = 0; c < gameState.cols; c++) {
        if (gameState.board[r][c].mine) {
          gameState.board[r][c].revealed = true;
        }
      }
    }

    messageEl.textContent = '💥 На жаль, ви програли! 💥';
    renderBoard();
    return;
  }

  openCell(row, col);
  renderBoard();
  checkWin();
}

// ========== ВІДМАЛЬОВУВАННЯ ==========
function renderBoard() {
  if (!boardEl) return;

  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${gameState.cols}, 45px)`;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.board[r][c];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell';

      if (cell.revealed) {
        btn.classList.add('open');
        if (cell.mine) {
          btn.classList.add('mine');
          btn.textContent = '💣';
        } else if (cell.neighborMines > 0) {
          btn.textContent = cell.neighborMines;
          btn.setAttribute('data-number', cell.neighborMines);
        }
      } else {
        btn.classList.add('closed');
        if (cell.flagged) {
          btn.classList.add('flag');
          btn.textContent = '🚩';
        }
      }

      btn.addEventListener(
        'click',
        (function (row, col) {
          return function () {
            handleClick(row, col);
          };
        })(r, c),
      );

      btn.addEventListener(
        'contextmenu',
        (function (row, col) {
          return function (e) {
            e.preventDefault();
            if (gameState.status === GAME_STATUS.PLAYING) {
              toggleFlag(row, col);
            }
          };
        })(r, c),
      );

      boardEl.appendChild(btn);
    }
  }
}

// ========== НОВА ГРА ==========
function initGame() {
  gameState.status = GAME_STATUS.IDLE;
  gameState.firstClick = true;
  gameState.flagsPlaced = 0;
  gameState.cellsRevealed = 0;
  gameState.seconds = 0;

  stopTimer();
  updateTimerDisplay();
  messageEl.textContent = '';

  gameState.board = createEmptyBoard();
  updateMinesDisplay();
  renderBoard();
}

// ========== СКЛАДНІСТЬ ==========
function setDifficulty(rows, cols, mines) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.totalMines = mines;
  initGame();
}

// ========== ПОДІЇ ==========
newGameBtn.addEventListener('click', initGame);

document.querySelectorAll('.difficulty button').forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.difficulty button')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    if (idx === 0) setDifficulty(10, 10, 12);
    else setDifficulty(16, 16, 40);
  });
});

initGame();

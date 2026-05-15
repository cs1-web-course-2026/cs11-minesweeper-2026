const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };
const CELL_TYPE = { EMPTY: 'empty', MINE: 'mine' };
const GAME_STATUS = { PLAYING: 'process', WIN: 'win', LOSE: 'lose' };

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  board: [], 
};

document.documentElement.style.setProperty('--board-columns', gameState.cols);

function generateField(rows, cols, minesCount) {
  gameState.board = [];
  for (let row = 0; row < rows; row++) {
    let currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({
        type: CELL_TYPE.EMPTY,
        neighborMines: 0,
        state: CELL_STATE.CLOSED,
      });
    }
    gameState.board.push(currentRow);
  }

  let currentMines = 0;
  while (currentMines < minesCount) {
    let row = Math.floor(Math.random() * rows);
    let col = Math.floor(Math.random() * cols);
    if (gameState.board[row][col].type !== CELL_TYPE.MINE) {
      gameState.board[row][col].type = CELL_TYPE.MINE;
      currentMines++;
    }
  }
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.board[row][col].type === CELL_TYPE.MINE) continue;
      let bombsCount = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          let checkY = row + dr;
          let checkX = col + dc;
          if (
            checkY >= 0 &&
            checkY < gameState.rows &&
            checkX >= 0 &&
            checkX < gameState.cols
          ) {
            if (gameState.board[checkY][checkX].type === CELL_TYPE.MINE)
              bombsCount++;
          }
        }
      }
      gameState.board[row][col].neighborMines = bombsCount;
    }
  }
}

function renderField() {
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellData = gameState.board[row][col];
      const cellElement = document.createElement('button');
      cellElement.type = 'button';
      cellElement.classList.add('cell');

      let stateLabel = 'closed';

      if (cellData.state === CELL_STATE.OPENED) {
        cellElement.classList.add('cell--open');
        if (cellData.type === CELL_TYPE.MINE) {
          cellElement.innerHTML = '💣';
          stateLabel = 'mine';
          if (gameState.status === GAME_STATUS.LOSE)
            cellElement.classList.add('cell--mine-exploded');
        } else if (cellData.neighborMines > 0) {
          cellElement.innerHTML = cellData.neighborMines;
          cellElement.classList.add(`color-${cellData.neighborMines}`);
          stateLabel = `open ${cellData.neighborMines}`;
        }
      } else if (cellData.state === CELL_STATE.FLAGGED) {
        cellElement.innerHTML = '🚩';
        stateLabel = 'flagged';
      }

      cellElement.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${col + 1}, ${stateLabel}`,
      );

      cellElement.addEventListener('click', () => {
        if (gameState.status !== GAME_STATUS.PLAYING) return;
        openCell(row, col);
        checkWin();
        renderField();
      });

      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (gameState.status !== GAME_STATUS.PLAYING) return;
        toggleFlag(row, col);
        updateMinesCount();
        renderField();
      });

      gridElement.appendChild(cellElement);
    }
  }
}

function updateMinesCount() {
  const flaggedCount = gameState.board
    .flat()
    .filter((c) => c.state === CELL_STATE.FLAGGED).length;
  const countDisplay = document.getElementById('mines-count');
  countDisplay.innerText = String(gameState.minesCount - flaggedCount).padStart(
    3,
    '0',
  );
}

function checkWin() {
  const messageElement = document.getElementById('game-message');

  if (gameState.status === GAME_STATUS.LOSE) {
    messageElement.textContent = 'Ой! Ви підірвалися на міні! 💥';
    revealAll();
    return;
  }

  const closedSafeCells = gameState.board
    .flat()
    .filter(
      (c) => c.type !== CELL_TYPE.MINE && c.state !== CELL_STATE.OPENED,
    ).length;
  if (closedSafeCells === 0) {
    gameState.status = GAME_STATUS.WIN;
    messageElement.textContent = 'Вітаю! Ви перемогли! 🏆';
    revealAll();
  }
}

function revealAll() {
  gameState.board.forEach((row) =>
    row.forEach((c) => (c.state = CELL_STATE.OPENED)),
  );
  clearInterval(gameState.timerId);
}

document.getElementById('reset-btn').addEventListener('click', () => {
  location.reload();
});

function init() {
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines();
  renderField();
  updateMinesCount();
}

function startTimer() {
  gameState.timerId = setInterval(function () {
    if (gameState.status === GAME_STATUS.PLAYING) {
      gameState.gameTime++;
      document.getElementById('timer').innerText = String(
        gameState.gameTime,
      ).padStart(3, '0');
    }
  }, 1000);
}

init();
startTimer();

function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;
  if (
    gameState.board[row][col].state === CELL_STATE.OPENED ||
    gameState.board[row][col].state === CELL_STATE.FLAGGED
  )
    return;

  gameState.board[row][col].state = CELL_STATE.OPENED;
  if (gameState.board[row][col].type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    return;
  }

  if (gameState.board[row][col].neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        openCell(row + dr, col + dc);
      }
    }
  }
}

function toggleFlag(row, col) {
  if (gameState.board[row][col].state === CELL_STATE.OPENED) return;
  gameState.board[row][col].state =
    gameState.board[row][col].state === CELL_STATE.FLAGGED
      ? CELL_STATE.CLOSED
      : CELL_STATE.FLAGGED;
}

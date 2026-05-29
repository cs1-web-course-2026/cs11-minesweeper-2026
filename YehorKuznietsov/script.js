// FIX: состояния вынесены в константы
const CELL_STATE = {
  CLOSED: "closed",
  OPENED: "opened",
  FLAGGED: "flagged"
};

const CELL_TYPE = {
  EMPTY: "empty",
  MINE: "mine"
};

const GAME_STATUS = {
  PLAYING: "process",
  WIN: "win",
  LOSE: "lose"
};

// FIX: field перенесён внутрь gameState
const gameState = {
  rows: 8,
  cols: 8,
  minesCount: 10,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  flagsCount: 0,
  field: []
};

// FIX: DOM-элементы кэшируются один раз
const timerElement = document.querySelector(".timer");
const boardElement = document.querySelector(".board");
const mineCountElement = document.querySelector(".mine-count");
const statusElement = document.querySelector(".status");

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    state: CELL_STATE.CLOSED,
    neighborMines: 0
  };
}

function generateField(rows, cols, minesCount) {
  gameState.field = [];

  for (let row = 0; row < rows; row++) {
    const line = [];

    for (let col = 0; col < cols; col++) {
      line.push(createCell());
    }

    gameState.field.push(line);
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
      if (gameState.field[row][col].type === CELL_TYPE.MINE) continue;

      let count = 0;

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (
            r >= 0 &&
            r < gameState.rows &&
            c >= 0 &&
            c < gameState.cols &&
            gameState.field[r][c].type === CELL_TYPE.MINE
          ) {
            count++;
          }
        }
      }

      gameState.field[row][col].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  const cell = gameState.field[row][col];

  if (
    cell.state === CELL_STATE.OPENED ||
    cell.state === CELL_STATE.FLAGGED
  ) {
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    revealMines();
    renderField();
    return;
  }

  if (cell.neighborMines === 0) {
    openEmptyCells(row, col);
  }

  checkWin();
  renderField();
}

function openEmptyCells(row, col) {
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (
        r >= 0 &&
        r < gameState.rows &&
        c >= 0 &&
        c < gameState.cols
      ) {
        const cell = gameState.field[r][c];

        if (
          cell.state === CELL_STATE.CLOSED &&
          cell.type !== CELL_TYPE.MINE
        ) {
          cell.state = CELL_STATE.OPENED;

          if (cell.neighborMines === 0) {
            openEmptyCells(r, c);
          }
        }
      }
    }
  }
}

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsCount++;
  } else {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsCount--;
  }

  renderField();
}

function revealMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) {
        gameState.field[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function checkWin() {
  let openedCells = 0;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].state === CELL_STATE.OPENED) {
        openedCells++;
      }
    }
  }

  const totalSafeCells =
    gameState.rows * gameState.cols - gameState.minesCount;

  if (openedCells === totalSafeCells) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    timerElement.textContent = formatTime(gameState.gameTime);
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");

  return `${min}:${sec}`;
}

function renderField() {
  boardElement.innerHTML = "";

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      const button = document.createElement("button");

      button.type = "button";
      button.classList.add("cell");

      // FIX: добавлен aria-label для каждой клетки
      button.setAttribute(
        "aria-label",
        `Row ${row + 1}, column ${col + 1}, ${cell.state}`
      );

      if (cell.state === CELL_STATE.CLOSED) {
        button.classList.add("closed");
      }

      if (cell.state === CELL_STATE.FLAGGED) {
        button.classList.add("open", "flag");
        button.textContent = "⚑";
      }

      if (cell.state === CELL_STATE.OPENED) {
        button.classList.add("open");

        if (cell.type === CELL_TYPE.MINE) {
          button.classList.add("mine");
          button.textContent = "💣";
        } else if (cell.neighborMines > 0) {
          button.textContent = cell.neighborMines;
          button.classList.add(getNumberClass(cell.neighborMines));
        }
      }

      button.addEventListener("click", () => {
        if (gameState.status !== GAME_STATUS.PLAYING) return;

        startTimer();
        openCell(row, col);
      });

      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        if (gameState.status !== GAME_STATUS.PLAYING) return;

        startTimer();
        toggleFlag(row, col);
      });

      boardElement.appendChild(button);
    }
  }

  mineCountElement.textContent =
    gameState.minesCount - gameState.flagsCount;

  if (gameState.status === GAME_STATUS.PLAYING) {
    statusElement.textContent = "Гра йде";
  }

  if (gameState.status === GAME_STATUS.WIN) {
    statusElement.textContent = "Ви виграли!";
  }

  if (gameState.status === GAME_STATUS.LOSE) {
    statusElement.textContent = "Ви програли!";
  }
}

function getNumberClass(number) {
  if (number === 1) return "one";
  if (number === 2) return "two";
  if (number === 3) return "three";

  return "four";
}

function newGame() {
  gameState.status = GAME_STATUS.PLAYING;
  gameState.gameTime = 0;
  gameState.flagsCount = 0;

  stopTimer();

  timerElement.textContent = "00:00";
  statusElement.textContent = "Почніть гру";

  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  renderField();
}

document.querySelectorAll(".new-game, .control-btn").forEach((button) => {
  button.addEventListener("click", newGame);
});

newGame();

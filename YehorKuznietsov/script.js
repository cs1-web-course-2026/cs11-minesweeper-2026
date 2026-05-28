const gameState = {
  rows: 8,
  cols: 8,
  minesCount: 10,
  status: "process",
  gameTime: 0,
  timerId: null,
  flagsCount: 0
};

let field = [];

function createCell() {
  return {
    type: "empty",
    state: "closed",
    neighborMines: 0
  };
}

function generateField(rows, cols, minesCount) {
  field = [];

  for (let row = 0; row < rows; row++) {
    const line = [];

    for (let col = 0; col < cols; col++) {
      line.push(createCell());
    }

    field.push(line);
  }

  let placedMines = 0;

  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (field[row][col].type !== "mine") {
      field[row][col].type = "mine";
      placedMines++;
    }
  }

  countNeighbourMines();
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].type === "mine") continue;

      let count = 0;

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (
            r >= 0 &&
            r < gameState.rows &&
            c >= 0 &&
            c < gameState.cols &&
            field[r][c].type === "mine"
          ) {
            count++;
          }
        }
      }

      field[row][col].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  const cell = field[row][col];

  if (cell.state === "opened" || cell.state === "flagged") return;

  cell.state = "opened";

  if (cell.type === "mine") {
    gameState.status = "lose";
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
        const cell = field[r][c];

        if (cell.state === "closed" && cell.type !== "mine") {
          cell.state = "opened";

          if (cell.neighborMines === 0) {
            openEmptyCells(r, c);
          }
        }
      }
    }
  }
}

function toggleFlag(row, col) {
  const cell = field[row][col];

  if (cell.state === "opened") return;

  if (cell.state === "closed") {
    cell.state = "flagged";
    gameState.flagsCount++;
  } else {
    cell.state = "closed";
    gameState.flagsCount--;
  }

  renderField();
}

function revealMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].type === "mine") {
        field[row][col].state = "opened";
      }
    }
  }
}

function checkWin() {
  let openedCells = 0;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].state === "opened") {
        openedCells++;
      }
    }
  }

  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;

  if (openedCells === totalSafeCells) {
    gameState.status = "win";
    stopTimer();
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    document.querySelector(".timer").textContent = formatTime(gameState.gameTime);
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
  const board = document.querySelector(".board");
  board.innerHTML = "";

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = field[row][col];
      const button = document.createElement("button");

      button.classList.add("cell");

      if (cell.state === "closed") {
        button.classList.add("closed");
      }

      if (cell.state === "flagged") {
        button.classList.add("open", "flag");
        button.textContent = "⚑";
      }

      if (cell.state === "opened") {
        button.classList.add("open");

        if (cell.type === "mine") {
          button.classList.add("mine");
          button.textContent = "💣";
        } else if (cell.neighborMines > 0) {
          button.textContent = cell.neighborMines;
          button.classList.add(getNumberClass(cell.neighborMines));
        }
      }

      button.addEventListener("click", () => {
        if (gameState.status !== "process") return;
        startTimer();
        openCell(row, col);
      });

      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        if (gameState.status !== "process") return;
        startTimer();
        toggleFlag(row, col);
      });

      board.appendChild(button);
    }
  }

  document.querySelector(".mine-count").textContent =
    gameState.minesCount - gameState.flagsCount;

  const status = document.querySelector(".status");

  if (gameState.status === "process") status.textContent = "Гра йде";
  if (gameState.status === "win") status.textContent = "Ви виграли!";
  if (gameState.status === "lose") status.textContent = "Ви програли!";
}

function getNumberClass(number) {
  if (number === 1) return "one";
  if (number === 2) return "two";
  if (number === 3) return "three";
  return "four";
}

function newGame() {
  gameState.status = "process";
  gameState.gameTime = 0;
  gameState.flagsCount = 0;
  stopTimer();

  document.querySelector(".timer").textContent = "00:00";

  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  renderField();
}

document.querySelectorAll(".new-game, .control-btn").forEach((button) => {
  button.addEventListener("click", newGame);
});

newGame();

// У практичній роботі №2 було реалізовано базову логіку гри Minesweeper за допомогою JavaScript. 
// Створено об’єкт gameState для збереження параметрів гри, двовимірний масив ігрового поля та функції для генерації клітинок і мін.

// Реалізовано підрахунок сусідніх мін, відкриття клітинок, встановлення прапорців, перевірку перемоги та поразки, а також рекурсивне відкриття порожніх клітинок.

// Також додано таймер гри через setInterval та оновлення інтерфейсу за допомогою DOM.


// У практичній роботі №3 було реалізовано логіку гри Minesweeper за допомогою JavaScript та взаємодію з DOM-елементами. 
// Створено структуру даних для ігрового поля, генерацію мін та підрахунок сусідніх клітинок.

// Реалізовано функції відкриття клітинок, встановлення прапорців, перевірку перемоги та поразки, а також рекурсивне відкриття порожніх областей поля.

// Також було додано таймер гри, оновлення інтерфейсу та обробку подій користувача через addEventListener.

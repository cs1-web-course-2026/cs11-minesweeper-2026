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
  field = [];

  for (let v = 0; v < rows; v++) {
    let row = [];
    for (let h = 0; h < cols; h++) {
      row.push({
        type: 'empty',
        neighborMines: 0,
        state: 'closed',
      });
    }
    field.push(row);
  }

  let currentMines = 0;

  while (currentMines < minesCount) {
    let v = Math.floor(Math.random() * rows);
    let h = Math.floor(Math.random() * cols);

    if (field[v][h].type !== 'mine') {
      field[v][h].type = 'mine';
      currentMines++;
    }
  }
}

function countNeighbourMines() {
  for (let v = 0; v < gameState.rows; v++) {
    for (let h = 0; h < gameState.cols; h++) {
      if (field[v][h].type === 'mine') continue;

      let bombsCount = 0;

      for (let le = -1; le <= 1; le++) {
        for (let hum = -1; hum <= 1; hum++) {
          let checkY = v + le;
          let checkX = h + hum;

          if (
            checkY >= 0 &&
            checkY < gameState.rows &&
            checkX >= 0 &&
            checkX < gameState.cols
          ) {
            if (field[checkY][checkX].type === 'mine') {
              bombsCount++;
            }
          }
        }
      }

      field[v][h].neighborMines = bombsCount;
    }
  }
}

generateField(gameState.rows, gameState.cols, gameState.minesCount);
countNeighbourMines();

function openCell(v, h) {
  if (v < 0 || v >= gameState.rows || h < 0 || h >= gameState.cols) {
    return;
  }

  if (field[v][h].state === 'opened' || field[v][h].state === 'flagged') {
    return;
  }

  field[v][h].state = 'opened';
  // щоб не вийти за межі масиву
  if (field[v][h].type === 'mine') {
    gameState.status = 'lose';
    return;
  }

  if (field[v][h].neighborMines === 0) {
    for (let le = -1; le <= 1; le++) {
      for (let hum = -1; hum <= 1; hum++) {
        if (le === 0 && hum === 0) continue;

        openCell(v + le, h + hum);
      }
    }
  }
}

function toggleFlag(v, h) {
  if (field[v][h].state === 'opened') {
    return;
  }

  // Якщо клітинка закрита то ставим прапорець
  // Якщо вже з прапорцем то знімаємо
  if (field[v][h].state === 'closed') {
    field[v][h].state = 'flagged';
  } else if (field[v][h].state === 'flagged') {
    field[v][h].state = 'closed';
  }
}

function startTimer() {
  gameState.timerId = setInterval(function () {
    if (gameState.status === 'process') {
      gameState.gameTime++; // додаю 1 секунду
    } else {
      clearInterval(gameState.timerId);
    }
  }, 1000);
}

startTimer();
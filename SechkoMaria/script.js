//  1. Моделювання даних (Data Layer)
const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: [] 
};

//  2. Генерація поля та мін
function generateField(rows, cols, minesCount) {
  gameState.field = [];
  
  // Створюємо порожню сітку
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0
      });
    }
    gameState.field.push(row);
  }

  // Розставляємо міни випадковим чином
  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (gameState.field[r][c].type !== 'mine') {
      gameState.field[r][c].type = 'mine';
      placedMines++;
    }
  }
}

//   3. Алгоритмічна частина (Business Logic)
function countNeighbourMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'mine') continue;

      let count = 0;
      // Перевіряємо 8 сусідів
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
            if (gameState.field[nr][nc].type === 'mine') count++;
          }
        }
      }
      gameState.field[r][c].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state !== 'closed' || gameState.status !== 'process') return;

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    clearInterval(gameState.timerId);
    console.log('Game Over! Ви підірвалися на міні.');
    return;
  }

  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = row + i;
        const nc = col + j;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }
  checkWin();
}

//  4. Інтерактив та таймер
function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || gameState.status !== 'process') return;
  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function checkWin() {
  let closedEmpty = 0;
  gameState.field.forEach(row => {
    row.forEach(cell => {
      if (cell.type === 'empty' && cell.state !== 'opened') closedEmpty++;
    });
  });

  if (closedEmpty === 0) {
    gameState.status = 'win';
    clearInterval(gameState.timerId);
    console.log('Вітаємо! Ви перемогли!');
  }
}

// Початковий запуск для тестування
function initGame() {
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines();
  startTimer();
  console.log('Гру ініціалізовано. Поле готове.');
}

initGame();
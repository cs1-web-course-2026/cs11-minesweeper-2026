
const CELL_STATE = {
	OPENED: 'opened',
	CLOSED: 'closed',
	FLAGGED: 'flagged',
};

const GAME_STATUS = {
	PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const CELL_CONTENT = {
	MINE: 'mine',
	EMPTY: 'empty',
};

const gameState = {
	rows: 10,
	cols: 10,
	minesCount: 15,
	status: GAME_STATUS.PROCESS,
	gameTime: 0,
	timerId: null,
};

function generateField(rows, cols, minesCount) {
  let field = [];

  for (let i = 0; i < rows; i++){
      field[i] = [];
      for (let j = 0; j < cols; j++){
          field[i][j] = {
              type: CELL_CONTENT.EMPTY, 
              state: CELL_STATE.CLOSED, 
              neighborMines: 0,
          }
      }
  }

	let placesMines = 0;

	while (placesMines < minesCount){
			let randomRow = Math.floor(Math.random() * rows);
			let randomCol = Math.floor(Math.random() * cols);

			if (field[randomRow][randomCol].type === CELL_CONTENT.EMPTY){
					field[randomRow][randomCol].type = CELL_CONTENT.MINE;
					placesMines++;
			}
	}

	return field;
}

function countNeighbourMines(field){
  let rows = field.length;
  let cols = field[0].length;
  
  // row - 1, col - 1   |  row - 1, col |   row - 1, col + 1
  // row, col - 1       |  row, col     |   row, col + 1
  // row + 1, col - 1   |  row + 1, col |   row + 1, col + 1

  for (let row = 0; row < rows; row++){
      for (let col = 0; col < cols; col++){
          if (field[row][col].type === CELL_CONTENT.EMPTY){
              let minesCount = 0;
              for (let directionalRow = -1; directionalRow <= 1; directionalRow++){
                  for (let directionalCol = -1; directionalCol <= 1; directionalCol++){
                      // Змінив let на const, оскільки ці змінні не перезаписуються в межах ітерації
                      const neighbourRow = row + directionalRow;
                      const neighbourCol = col + directionalCol;
                      
                      // 4,4 | 4,5 | 4,6
                      // 5,4 | (5,5) | 5,6
                      // 6,4 | 6,5 | 6,6
                      if (neighbourRow >= 0 && neighbourRow < rows && 
                          neighbourCol >= 0 && neighbourCol < cols && 
                          field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE){
                          minesCount++;
                      }
                  }
              }
              field[row][col].neighborMines = minesCount;
          }
      }
  }
  return field;
}

// ПЕРЕРОБЛЕНО: Тепер це чиста функція, яка лише повертає true/false
function checkWinCondition(field, minesCount) {
  let rows = field.length;
  let cols = field[0].length;
  let safeCellsCount = rows * cols - minesCount;
  let openedCellsCount = 0;

  for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
          if (field[r][c].state === CELL_STATE.OPENED) {
              openedCellsCount++;
          }
      }
  }

  // Повертаємо логічне значення (true, якщо виграли)
  return openedCellsCount === safeCellsCount;
}

// ПЕРЕРОБЛЕНО: Чиста функція. Не чіпає gameState, console.log чи таймери.
function revealCell(field, row, col){
  let rows = field.length;
  let cols = field[0].length;

  // Базовий випадок: клітинка вже відкрита або з прапорцем
  if (field[row][col].state === CELL_STATE.OPENED || field[row][col].state === CELL_STATE.FLAGGED){
      return { field: field, hitMine: false };
  }
  
  // Якщо міна — повертаємо результат hitMine: true
  if (field[row][col].type === CELL_CONTENT.MINE){
      return { field: field, hitMine: true };
  }
  
  field[row][col].state = CELL_STATE.OPENED;

  // Оптимізована рекурсія з ПРАВИЛЬНИМИ назвами змінних для лінтера
  if (field[row][col].neighborMines === 0){
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++){
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++){
            if (directionalRow === 0 && directionalCol === 0) continue; 
            
            const neighbourRow = row + directionalRow;
            const neighbourCol = col + directionalCol;

            if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
                // Оскільки revealCell тепер повертає об'єкт, дістаємо з нього оновлене поле
                let result = revealCell(field, neighbourRow, neighbourCol);
                field = result.field;
            }
        }
    }
  }

  // Повертаємо безпечне поле
  return { field: field, hitMine: false };
}

function toggleFlag(field, row, col){
	if (field[row][col].state === CELL_STATE.OPENED){
			return field;
	} else if (field[row][col].state === CELL_STATE.CLOSED){
			field[row][col].state = CELL_STATE.FLAGGED;
	} else {
			field[row][col].state = CELL_STATE.CLOSED;
	}
	return field;
}

function startTimer() {
  if (gameState.timerId !== null) return; // Запобігаємо запуску кількох таймерів одночасно
  gameState.timerId = setInterval(function() {
      gameState.gameTime++;
  }, 1000);
}

function stopTimer(){
  clearInterval(gameState.timerId);
  gameState.timerId = null; // Очищаємо ID після зупинки
}



// let field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
// field = countNeighbourMines(field);
// startTimer();

// console.table(field);

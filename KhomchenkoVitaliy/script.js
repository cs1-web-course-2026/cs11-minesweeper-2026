
const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const CELL_STATE = {
	OPENED: 'opened',
	CLOSED: 'closed',
	FLAGGED: 'flagged',
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
                      if (directionalRow === 0 && directionalCol === 0) continue; 
                      const neighbourRow = row + directionalRow;
                      const neighbourCol = col + directionalCol;

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

function revealCell(field, row, col){
  let rows = field.length;
  let cols = field[0].length;

  if (field[row][col].state === CELL_STATE.OPENED || field[row][col].state === CELL_STATE.FLAGGED){
      return { field: field, hitMine: false };
  }
  
  field[row][col].state = CELL_STATE.OPENED;

  if (field[row][col].type === CELL_CONTENT.MINE){
      return { field: field, hitMine: true };
  }

  if (field[row][col].neighborMines === 0){
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++){
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++){
            if (directionalRow === 0 && directionalCol === 0) continue; 
            const neighbourRow = row + directionalRow;
            const neighbourCol = col + directionalCol;
            // 4,4 | 4,5 | 4,6
            // 5,4 | (5,5) | 5,6
            // 6,4 | 6,5 | 6,6
            if (neighbourRow >= 0 && neighbourRow < rows &&
                neighbourCol >= 0 && neighbourCol < cols) {
                let result = revealCell(field, neighbourRow, neighbourCol);
                field = result.field;
            }
        }
    }
  }

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
  if (gameState.timerId !== null) return;
  gameState.timerId = setInterval(function() {
      gameState.gameTime++;
      timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
  }, 1000);
}

function stopTimer(){
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

// DOM
const boardElement = document.querySelector('.game-board');
const flagsElement = document.querySelector('.flags');
const restartBtnElement = document.querySelector('.restart-btn');
const timerElement = document.querySelector('.timer');

restartBtnElement.addEventListener('click', initGame);

let field = []; // global

function initGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;
  timerElement.textContent = '000';
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(field);
  renderBoard();
  startTimer();
}

function renderBoard() {
  boardElement.innerHTML = '';
  let flagsPlaced = 0;
  
  for (let row = 0; row < gameState.rows; row++){
    for (let col = 0; col < gameState.cols; col++){
      const cellData = field[row][col];
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');

      if (cellData.state === CELL_STATE.OPENED){
        cellElement.classList.add('open');

        if (cellData.type === CELL_CONTENT.MINE){
          cellElement.classList.add('mine');
        } else if (cellData.neighborMines > 0){
          cellElement.textContent = cellData.neighborMines; // Пишемо цифру
          cellElement.classList.add(`number${cellData.neighborMines}`); // Додаємо колір цифрі
        }
      } else if (cellData.state === CELL_STATE.FLAGGED){
        cellElement.classList.add('flag');
        flagsPlaced++;
      }


      cellElement.addEventListener('click', () => handleCellClick(row, col));
      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick(row, col);
      });

      boardElement.appendChild(cellElement);
    }
  }
  // string.padStart щоб автоматично додаючи нулі спереду
  flagsElement.textContent = String(gameState.minesCount - flagsPlaced).padStart(3, '0');
}

function handleCellClick(row, col){
  if (gameState.status !== GAME_STATUS.PROCESS) return;
  const result = revealCell(field, row, col);
  field = result.field;

  if (result.hitMine){
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    renderBoard();
    return;
  }

  if (checkWinCondition(field, gameState.minesCount)){
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
    renderBoard();
    return;
  }

  renderBoard();
}

function handleRightClick(row, col){
  if (gameState.status !== GAME_STATUS.PROCESS) return;
  const result = toggleFlag(field, row, col);
  field = result;
  renderBoard();
}


initGame();

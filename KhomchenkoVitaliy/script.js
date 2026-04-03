
const CELL_STATE = Object.freeze({
  OPENED: 'opened',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
});

const GAME_STATUS = Object.freeze({
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
});

const CELL_CONTENT = Object.freeze({
  MINE: 'mine',
  EMPTY: 'empty',
});

const gameState = {
	rows: 10,
	cols: 10,
	minesCount: 15,
	status: GAME_STATUS.PROCESS,
	gameTime: 0,
	timerId: null,
  openedCellsCount: 0,
  field: []
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

function checkWinCondition(openedCellsCount, rows, cols, minesCount) {
  const safeCellsCount = rows * cols - minesCount;
  // Повертаємо логічне значення (true, якщо виграли)
  return openedCellsCount === safeCellsCount;
}

function revealCell(field, row, col){
  let rows = field.length;
  let cols = field[0].length;

  if (field[row][col].state === CELL_STATE.OPENED || field[row][col].state === CELL_STATE.FLAGGED){
      return { field: field, hitMine: false };
  }
  
  if (field[row][col].type === CELL_CONTENT.MINE){
    field[row][col].state = CELL_STATE.OPENED;
    return { field: field, hitMine: true };
}

  field[row][col].state = CELL_STATE.OPENED;
  gameState.openedCellsCount++;

  if (field[row][col].neighborMines === 0){
    field = revealEmptyNeighbors(field, row, col);
  }

  return { field: field, hitMine: false };
}

function revealEmptyNeighbors(field, row, col) {
  let rows = field.length;
  let cols = field[0].length;

  for (let directionalRow = -1; directionalRow <= 1; directionalRow++){
      for (let directionalCol = -1; directionalCol <= 1; directionalCol++){
          if (directionalRow === 0 && directionalCol === 0) continue; 
          const neighbourRow = row + directionalRow;
          const neighbourCol = col + directionalCol;
                      // 4,4 | 4,5 | 4,6
                      // 5,4 | (5,5) | 5,6
                      // 6,4 | 6,5 | 6,6
          if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
              let result = revealCell(field, neighbourRow, neighbourCol);
              field = result.field;
          }
      }
  }
  return field;
}

function toggleFlag(field, row, col){
	if (field[row][col].state === CELL_STATE.OPENED){
			return;
	} else if (field[row][col].state === CELL_STATE.CLOSED){
			field[row][col].state = CELL_STATE.FLAGGED;
	} else {
			field[row][col].state = CELL_STATE.CLOSED;
	}
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

function initGame() {
  stopTimer();
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.openedCellsCount = 0;
  timerElement.textContent = '000';

  const msgElement = document.getElementById('game-message');
  msgElement.textContent = '';
  msgElement.className = '';

  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  renderBoard();
  startTimer();
}

function renderBoard() {
  boardElement.innerHTML = '';
  let flagsPlaced = 0;
  
  for (let row = 0; row < gameState.rows; row++){
    for (let col = 0; col < gameState.cols; col++){
      const cellData = gameState.field[row][col];
      const cellElement = document.createElement('button');
      cellElement.type = 'button';
      cellElement.classList.add('cell');

      // Screen Reader
      let label = `Row ${row + 1}, column ${col + 1}, `;
      if (cellData.state === CELL_STATE.FLAGGED) {
        label += 'flagged';
      } else if (cellData.state === CELL_STATE.OPENED) {
        label += cellData.type === CELL_CONTENT.MINE
          ? 'mine'
          : cellData.neighborMines > 0
            ? `opened, ${cellData.neighborMines} adjacent mines`
            : 'opened, empty';
      } else {
        label += 'closed';
      }
      cellElement.setAttribute('aria-label', label);
      //
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
  const result = revealCell(gameState.field, row, col);
  gameState.field = result.field;

  const msgElement = document.getElementById('game-message');

  if (result.hitMine){
    gameState.status = GAME_STATUS.LOSE;
    msgElement.textContent = '💥 Game over! You hit a mine.';
    msgElement.className = 'message-loss';
    stopTimer();
    renderBoard();
    return;
  }

  if (checkWinCondition(
    gameState.openedCellsCount, 
    gameState.rows, 
    gameState.cols, 
    gameState.minesCount
  )) {
    gameState.status = GAME_STATUS.WIN;
    msgElement.textContent = '🎉 You won!';
    msgElement.className = 'message-win';
    stopTimer();
    renderBoard();
    return;
  }

  renderBoard();
}

function handleRightClick(row, col){
  if (gameState.status !== GAME_STATUS.PROCESS) return;
  toggleFlag(gameState.field, row, col);
  renderBoard();
}


initGame();

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
};

let field = [];

document.documentElement.style.setProperty('--board-columns', gameState.cols);

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
            if (field[checkY][checkX].type === 'mine') bombsCount++;
          }
        }
      }
      field[v][h].neighborMines = bombsCount;
    }
  }
}



function renderField() {
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = ''; 

  for (let v = 0; v < gameState.rows; v++) {
    for (let h = 0; h < gameState.cols; h++) {
      const cellData = field[v][h];
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');

      
      if (cellData.state === 'opened') {
        cellElement.classList.add('cell--open');
        if (cellData.type === 'mine') {
          cellElement.innerHTML = '💣';
          if (gameState.status === 'lose')
            cellElement.classList.add('cell--mine-exploded');
        } else if (cellData.neighborMines > 0) {
          cellElement.innerHTML = cellData.neighborMines;
          cellElement.classList.add(`color-${cellData.neighborMines}`);
        }
      } else if (cellData.state === 'flagged') {
        cellElement.innerHTML = '🚩';
      }

  
      cellElement.addEventListener('click', () => {
        if (gameState.status !== 'process') return;
        openCell(v, h);
        checkWin();
        renderField();
      });

     
      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault(); 
        if (gameState.status !== 'process') return;
        toggleFlag(v, h);
        updateMinesCount();
        renderField();
      });

      gridElement.appendChild(cellElement);
    }
  }
}

function updateMinesCount() {
  const flaggedCount = field.flat().filter((c) => c.state === 'flagged').length;
  const countDisplay = document.getElementById('mines-count');
  countDisplay.innerText = String(gameState.minesCount - flaggedCount).padStart(
    3,
    '0',
  );
}

function checkWin() {
  if (gameState.status === 'lose') {
    alert('Ой! Ви підірвалися на міні! 💥');
    revealAll();
    return;
  }

  const closedSafeCells = field
    .flat()
    .filter((c) => c.type !== 'mine' && c.state !== 'opened').length;
  if (closedSafeCells === 0) {
    gameState.status = 'win';
    alert('Вітаю! Ви перемогли! 🏆');
    revealAll();
  }
}

function revealAll() {
  field.forEach((row) => row.forEach((c) => (c.state = 'opened')));
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
    if (gameState.status === 'process') {
      gameState.gameTime++;
      document.getElementById('timer').innerText = String(
        gameState.gameTime,
      ).padStart(3, '0');
    }
  }, 1000);
}

init();
startTimer();


function openCell(v, h) {
  if (v < 0 || v >= gameState.rows || h < 0 || h >= gameState.cols) return;
  if (field[v][h].state === 'opened' || field[v][h].state === 'flagged') return;

  field[v][h].state = 'opened';
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
  if (field[v][h].state === 'opened') return;
  field[v][h].state = field[v][h].state === 'flagged' ? 'closed' : 'flagged';
}

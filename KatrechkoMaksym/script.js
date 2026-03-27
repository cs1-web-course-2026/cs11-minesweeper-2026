const GAME_STATUS = {
    PROCESS: 'process',
    LOSE: 'lose',
    WIN: 'win'
};

const CELL_TYPE = {
    EMPTY: 'empty',
    MINE: 'mine'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    timerId: null,
    field: []
};

const fieldElement = document.getElementById('minefield');
const timerDisplay = document.getElementById('timer');
const mineDisplay = document.getElementById('mine-count');

if (fieldElement) {
    fieldElement.style.setProperty('--cols', gameState.cols);
}

function initGame() {
    gameState.status = GAME_STATUS.PROCESS;
    gameState.gameTime = 0;
    clearInterval(gameState.timerId);

    if (timerDisplay) timerDisplay.textContent = '000';
    if (mineDisplay) mineDisplay.textContent = String(gameState.minesCount).padStart(3, '0');

    gameState.field = Array.from({ length: gameState.rows }, () =>
        Array.from({ length: gameState.cols }, () => ({
            type: CELL_TYPE.EMPTY,
            state: CELL_STATE.CLOSED,
            neighborMines: 0
        }))
    );

    let minesPlaced = 0;
    while (minesPlaced < gameState.minesCount) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        if (gameState.field[row][col].type !== CELL_TYPE.MINE) {
            gameState.field[row][col].type = CELL_TYPE.MINE;
            minesPlaced++;
        }
    }

    calculateNeighbors();
    startTimer();
    render();
}

function calculateNeighbors() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.field[row][col].type === CELL_TYPE.MINE) continue;

            let minesAround = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const neighborRow = row + i;
                    const neighborCol = col + j;
                    if (
                        neighborRow >= 0 && neighborRow < gameState.rows &&
                        neighborCol >= 0 && neighborCol < gameState.cols
                    ) {
                        if (gameState.field[neighborRow][neighborCol].type === CELL_TYPE.MINE) {
                            minesAround++;
                        }
                    }
                }
            }
            gameState.field[row][col].neighborMines = minesAround;
        }
    }
}

function render() {
    if (!fieldElement) return;
    fieldElement.innerHTML = '';

    gameState.field.forEach((rowArray, rowIndex) => {
        rowArray.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');

            if (cell.state === CELL_STATE.OPENED) {
                cellDiv.classList.add('open');
                if (cell.type === CELL_TYPE.MINE) {
                    cellDiv.innerHTML = '💣';
                    if (gameState.status === GAME_STATUS.LOSE) cellDiv.classList.add('exploded');
                } else if (cell.neighborMines > 0) {
                    cellDiv.innerHTML = `<span class="n${cell.neighborMines}">${cell.neighborMines}</span>`;
                }
            } else if (cell.state === CELL_STATE.FLAGGED) {
                cellDiv.innerHTML = '🚩';
            }

            cellDiv.onclick = () => {
                openCell(rowIndex, colIndex);
                render();
            };
            cellDiv.oncontextmenu = (e) => {
                e.preventDefault();
                toggleFlag(rowIndex, colIndex);
                render();
            };
            fieldElement.appendChild(cellDiv);
        });
    });
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    const cell = gameState.field[row][col];
    if (cell.state !== CELL_STATE.CLOSED) return;

    cell.state = CELL_STATE.OPENED;

    if (cell.type === CELL_TYPE.MINE) {
        gameState.status = GAME_STATUS.LOSE;
        clearInterval(gameState.timerId);
        revealMines();
    } else if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nRow = row + i;
                const nCol = col + j;
                if (nRow >= 0 && nRow < gameState.rows && nCol >= 0 && nCol < gameState.cols) {
                    openCell(nRow, nCol);
                }
            }
        }
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    const cell = gameState.field[row][col];
    if (cell.state === CELL_STATE.OPENED) return;

    cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}

function revealMines() {
    gameState.field.forEach(row => 
        row.forEach(cell => {
            if (cell.type === CELL_TYPE.MINE) cell.state = CELL_STATE.OPENED;
        })
    );
}

function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        if (timerDisplay) {
            timerDisplay.textContent = String(gameState.gameTime).padStart(3, '0');
        }
    }, 1000);
}

const newGameBtn = document.querySelector('.new-game-btn');
if (newGameBtn) newGameBtn.onclick = initGame;

initGame();

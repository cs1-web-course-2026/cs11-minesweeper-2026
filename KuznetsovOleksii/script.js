const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const CELL_TYPE = {
    MINE: 'mine',
    EMPTY: 'empty'
};

const GAME_STATUS = {
    PLAYING: 'process',
    WIN: 'win',
    LOSE: 'lose'
};

const gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null,
    field: []
};

const fieldContainer = document.querySelector('.field');
const restartButton = document.querySelector('.restart');
const timerElement = document.querySelector('.timer');
const counterElement = document.querySelector('.counter');
const gameMessage = document.getElementById('game-message');

function initGame() {
    gameState.field = [];
    gameState.status = GAME_STATUS.PLAYING;
    gameState.gameTime = 0;
    gameMessage.textContent = '';
    
    if (gameState.timerId) clearInterval(gameState.timerId);
    timerElement.textContent = '000';

    for (let row = 0; row < gameState.rows; row++) {
        const rowData = [];
        for (let col = 0; col < gameState.cols; col++) {
            rowData.push({
                type: CELL_TYPE.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0
            });
        }
        gameState.field.push(rowData);
    }

    let minesPlaced = 0;
    while (minesPlaced < gameState.minesCount) {
        const randomRow = Math.floor(Math.random() * gameState.rows);
        const randomCol = Math.floor(Math.random() * gameState.cols);
        if (gameState.field[randomRow][randomCol].type !== CELL_TYPE.MINE) {
            gameState.field[randomRow][randomCol].type = CELL_TYPE.MINE;
            minesPlaced++;
        }
    }

    countNeighbors();
    startTimer();
    renderField();
}

function countNeighbors() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.field[row][col].type === CELL_TYPE.MINE) continue;
            
            let count = 0;
            for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
                for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                    const neighborRow = row + directionalRow;
                    const neighborCol = col + directionalCol;
                    if (neighborRow >= 0 && neighborRow < gameState.rows && 
                        neighborCol >= 0 && neighborCol < gameState.cols) {
                        if (gameState.field[neighborRow][neighborCol].type === CELL_TYPE.MINE) count++;
                    }
                }
            }
            gameState.field[row][col].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    const cell = gameState.field[row][col];
    if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PLAYING) return;

    if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
        endGame(GAME_STATUS.LOSE);
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
            for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                const neighborRow = row + directionalRow;
                const neighborCol = col + directionalCol;
                if (neighborRow >= 0 && neighborRow < gameState.rows && 
                    neighborCol >= 0 && neighborCol < gameState.cols) {
                    openCell(neighborRow, neighborCol);
                }
            }
        }
    }
    checkWin();
}

function toggleFlag(row, col) {
    const cell = gameState.field[row][col];
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
    }
}

function checkWin() {
    let openedCount = 0;
    gameState.field.forEach(row => {
        row.forEach(cell => {
            if (cell.state === CELL_STATE.OPENED && cell.type !== CELL_TYPE.MINE) openedCount++;
        });
    });

    if (openedCount === (gameState.rows * gameState.cols) - gameState.minesCount) {
        endGame(GAME_STATUS.WIN);
    }
}

function endGame(status) {
    gameState.status = status;
    clearInterval(gameState.timerId);
    
    if (status === GAME_STATUS.WIN) {
        restartButton.textContent = '😎';
        gameMessage.textContent = 'Win';
    } else {
        restartButton.textContent = '😵';
        gameMessage.textContent = 'Lose';
        gameState.field.forEach(row => row.forEach(cell => {
            if (cell.type === CELL_TYPE.MINE) cell.state = CELL_STATE.OPENED;
        }));
    }
    renderField();
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
    }, 1000);
}

function renderField() {
    if (!fieldContainer) return;
    fieldContainer.innerHTML = '';

    gameState.field.forEach((rowData, rowIndex) => {
        rowData.forEach((cell, colIndex) => {
            const cellButton = document.createElement('button');
            cellButton.type = 'button';
            cellButton.classList.add('cell');
            
            let stateLabel = cell.state === 'flagged' ? 'flagged' : cell.state === 'opened' ? (cell.type === 'mine' ? 'mine' : `open ${cell.neighborMines}`) : 'closed';
            cellButton.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${colIndex + 1}, ${stateLabel}`);

            if (cell.state === CELL_STATE.CLOSED) {
                cellButton.classList.add('closed');
            } else if (cell.state === CELL_STATE.FLAGGED) {
                cellButton.classList.add('closed', 'flag');
            } else if (cell.state === CELL_STATE.OPENED) {
                cellButton.classList.add('open');
                if (cell.type === CELL_TYPE.MINE) {
                    cellButton.classList.add('mine');
                    if (gameState.status === GAME_STATUS.LOSE) cellButton.classList.add('clicked');
                } else if (cell.neighborMines > 0) {
                    cellButton.textContent = cell.neighborMines;
                    cellButton.setAttribute('data-number', cell.neighborMines);
                }
            }

            cellButton.addEventListener('click', () => {
                openCell(rowIndex, colIndex);
                renderField();
            });

            cellButton.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                toggleFlag(rowIndex, colIndex);
                renderField();
            });

            fieldContainer.appendChild(cellButton);
        });
    });

    const flagsCount = gameState.field.flat().filter(cell => cell.state === CELL_STATE.FLAGGED).length;
    counterElement.textContent = `🚩 ${String(gameState.minesCount - flagsCount).padStart(3, '0')}`;
}

restartButton.addEventListener('click', () => {
    restartButton.textContent = '🙂';
    initGame();
});

initGame();

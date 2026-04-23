const GAME_STATUS = {
    PROCESS: 'process',
    WIN: 'win',
    LOSE: 'lose'
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
    rowsCount: 8,
    colsCount: 8,
    minesLimit: 10,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    timerId: null,
    field: [],
    flagsUsed: 0
};

function initGame() {
    stopTimer();
    gameState.status = GAME_STATUS.PROCESS;
    gameState.gameTime = 0;
    gameState.flagsUsed = 0;
    gameState.timerId = null;
    
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('flags-count').innerText = "0";
    
    generateField(gameState.rowsCount, gameState.colsCount, gameState.minesLimit);
    render();
}

function generateField(rows, cols, minesCount) {
    gameState.field = [];
    for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        const rowData = [];
        for (let colIdx = 0; colIdx < cols; colIdx++) {
            rowData.push({ 
                type: CELL_TYPE.EMPTY, 
                state: CELL_STATE.CLOSED, 
                neighborMines: 0, 
                row: rowIdx, 
                col: colIdx 
            });
        }
        gameState.field.push(rowData);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);
        
        if (gameState.field[randomRow][randomCol].type !== CELL_TYPE.MINE) {
            gameState.field[randomRow][randomCol].type = CELL_TYPE.MINE;
            placedMines++;
        }
    }
    countNeighbourMines();
}

function countNeighbourMines() {
    const { rowsCount, colsCount, field } = gameState;
    
    for (let rowIdx = 0; rowIdx < rowsCount; rowIdx++) {
        for (let colIdx = 0; colIdx < colsCount; colIdx++) {
            if (field[rowIdx][colIdx].type === CELL_TYPE.MINE) continue;
            
            let minesAround = 0;
            for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                for (let colOffset = -1; colOffset <= 1; colOffset++) {
                    const neighborRow = rowIdx + rowOffset;
                    const neighborCol = colIdx + colOffset;
                    
                    if (
                        neighborRow >= 0 && neighborRow < rowsCount && 
                        neighborCol >= 0 && neighborCol < colsCount && 
                        field[neighborRow][neighborCol].type === CELL_TYPE.MINE
                    ) {
                        minesAround++;
                    }
                }
            }
            field[rowIdx][colIdx].neighborMines = minesAround;
        }
    }
}

function render() {
    const fieldContainer = document.getElementById('game-field');
    fieldContainer.innerHTML = '';

    gameState.field.forEach((rowArray) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'blocks-in-row';

        rowArray.forEach((cell) => {
            const cellElement = document.createElement('div');

            // Логіка відображення станів клітинок
            if (cell.state === CELL_STATE.CLOSED) {
                cellElement.className = 'blue-box';
            } else if (cell.state === CELL_STATE.FLAGGED) {
                cellElement.className = 'box-flag';
                cellElement.innerText = '🚩';
            } else if (cell.state === CELL_STATE.OPENED) {
                if (cell.type === CELL_TYPE.MINE) {
                    cellElement.className = 'white-box mine-cell';
                    cellElement.innerText = '💣';
                } else if (cell.neighborMines > 0) {
                    const num = Math.min(cell.neighborMines, 8);
                    cellElement.className = `box-number-${num}`;
                    cellElement.innerText = cell.neighborMines;
                } else {
                    cellElement.className = 'white-box';
                }
            }

            cellElement.addEventListener('click', () => {
                if (gameState.status !== GAME_STATUS.PROCESS) return;
                openCell(cell.row, cell.col);
                render();
            });

            cellElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                if (gameState.status !== GAME_STATUS.PROCESS) return;
                toggleFlag(cell.row, cell.col);
                render();
            });

            rowElement.appendChild(cellElement);
        });
        fieldContainer.appendChild(rowElement);
    });

    document.getElementById('flags-count').innerText = gameState.flagsUsed;
}

function openCell(rowIdx, colIdx) {
    const cell = gameState.field[rowIdx][colIdx];
    if (cell.state !== CELL_STATE.CLOSED) return;

    if (!gameState.timerId && gameState.status === GAME_STATUS.PROCESS) startTimer();

    if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
        endGame(GAME_STATUS.LOSE);
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const neighborRow = rowIdx + rowOffset;
                const neighborCol = colIdx + colOffset;
                
                if (
                    neighborRow >= 0 && neighborRow < gameState.rowsCount && 
                    neighborCol >= 0 && neighborCol < gameState.colsCount
                ) {
                    openCell(neighborRow, neighborCol);
                }
            }
        }
    }
    checkWin();
}

function toggleFlag(rowIdx, colIdx) {
    const cell = gameState.field[rowIdx][colIdx];
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
        gameState.flagsUsed--;
    } else if (gameState.flagsUsed < gameState.minesLimit) {
        cell.state = CELL_STATE.FLAGGED;
        gameState.flagsUsed++;
    }
}

function startTimer() {
    if (gameState.timerId) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        const minutes = Math.floor(gameState.gameTime / 60).toString().padStart(2, '0');
        const seconds = (gameState.gameTime % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${minutes}:${seconds}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function checkWin() {
    let closedEmptyCells = 0;
    gameState.field.forEach(row => row.forEach(cell => {
        if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
            closedEmptyCells++;
        }
    }));
    if (closedEmptyCells === 0) endGame(GAME_STATUS.WIN);
}

function endGame(result) {
    gameState.status = result;
    stopTimer();
    
    // Відкриваємо всі міни в кінці
    gameState.field.forEach(row => row.forEach(cell => {
        if (cell.type === CELL_TYPE.MINE) cell.state = CELL_STATE.OPENED;
    }));
    
    render();

    setTimeout(() => {
        if (result === GAME_STATUS.WIN) {
            alert('🎉 Перемога! Час: ' + document.getElementById('timer-display').innerText);
        } else {
            alert('💥 Бум! Ви програли.');
        }
    }, 200);
}

window.onload = initGame;
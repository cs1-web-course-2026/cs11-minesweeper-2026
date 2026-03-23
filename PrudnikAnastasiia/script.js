function render() {
    const gameContainer = document.querySelector('.game');
    gameContainer.innerHTML = '';
    gameState.field.forEach((row, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'cell-row';
        row.forEach((cell, j) => {
            const cellDiv = document.createElement('div');
            if (cell.state === 'closed') {
                cellDiv.className = 'empty-cell';
            }
            else if (cell.state === 'flagged') {
                cellDiv.className = 'flag-cell';
            }
            else if (cell.state === 'opened') {
                if (cell.type === 'mine') {
                    cellDiv.className = 'bomb-cell';
                }
                else {
                    cellDiv.className = 'empty-cell-opened';
                    if (cell.neighbourMines > 0) {
                        cellDiv.innerHTML = `<p class = "num-cell">${cell.neighbourMines}</p>`;
                    }
                }
            }
            cellDiv.addEventListener('click', () => {
                openCell(i, j);
                render();
            });
            cellDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(i, j);
                render();
            });
            rowDiv.appendChild(cellDiv);
        });
        gameContainer.appendChild(rowDiv);
    });
}

const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 16, // Налаштування складності
    status: 'process', // Поточний стан гри: 'process' | 'win' | 'lose'
    gameTime: 0, // Час гри у секундах
    timerID: null, // Посилання на ідентифікатор таймера для його зупинки (clearInterval)
    field: []
};

function generateField(rows, cols, minesCount) {
    gameState.field = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push({
                type: 'empty',
                state: 'closed',
                neighbourMines: 0,
                row: i,
                cols: j
            });
        }
        gameState.field.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const i = Math.floor(Math.random() * rows);
        const j = Math.floor(Math.random() * cols);
        if (gameState.field[i][j].type !== 'mine') {
            gameState.field[i][j].type = 'mine';
            placedMines++;
        }
    }

    countNeighbourMines();
}

function countNeighbourMines() {
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            if (gameState.field[i][j].type === 'mine') {
                continue;
            }
            let count = 0;
            for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                    const neighbourRow = i + deltaRow;
                    const neighbourCol = j + deltaCol;
                    if (neighbourRow >= 0 && neighbourRow < gameState.rows && neighbourCol >= 0 && neighbourCol < gameState.cols) {
                        if (gameState.field[neighbourRow][neighbourCol].type === 'mine') {
                            count++;
                        }
                    }
                }
            }
            gameState.field[i][j].neighbourMines = count;
        }
    }
}

function openCell(i, j) {
    const cell = gameState.field[i][j];
    if (cell.state !== 'closed' || gameState.status !== 'process') {
        return;
    }
    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    cell.state = 'opened';

    if (cell.neighbourMines === 0) {
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for (let deltaCol = -1; deltaCol <=1; deltaCol++) {
                const neighbourRow = i + deltaRow;
                const neighbourCol = j + deltaCol;
                if (neighbourRow >= 0 && neighbourRow < gameState.rows && neighbourCol >= 0 && neighbourCol < gameState.cols) {
                    openCell(neighbourRow, neighbourCol);
                }
            }
        }
    }
    checkWin();
}

function toggleFlag(row, col) {
    const cell = gameState.field[row][col];
    if (cell.state === 'opened' || gameState.status !== 'process') {
        return
    }
    if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
    else {
        cell.state = 'flagged'
    }
}

function startTimer() {
    if (gameState.timerID) {
        clearInterval(gameState.timerID);
    }
    gameState.gameTime = 0;
    gameState.timerID = setInterval(() => {
        gameState.gameTime++;
        console.log(`Час: ${gameState.gameTime} секунд`);
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerID);
}

function checkWin() {
    let closedEmptyCells = 0;
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            if (gameState.field[i][j].type === 'empty' && gameState.field[i][j].state !== 'opened') {
                closedEmptyCells++;
            }
        }
    }
    if (closedEmptyCells === 0) {
        endGame('win');
    }
}

function endGame(result) {
    gameState.status = result;
    stopTimer();
    setTimeout(() => {
        if (result === 'lose') {
            alert('Ви відкрили міну! Гра програна!')
        }
        else if (result === 'win') {
            alert('Ви виграли!')
        }
        initGame();
        render();
    }, 100);
}

function initGame() {
    gameState.status = 'process';
    generateField(gameState.rows, gameState.cols, gameState.minesCount);
    startTimer();
}

document.querySelector('.button').addEventListener('click', () => {
    initGame();
    render();
});
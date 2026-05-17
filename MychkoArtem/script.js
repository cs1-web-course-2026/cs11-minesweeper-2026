const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process', 
    gameTime: 0,
    openedCells: 0,
    timerId: null
};

let field = []; 

function generateField(rows, cols, minesCount) {
    field = []; 
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty', 
                state: 'closed', 
                neighborMines: 0
            });
        }
        field.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type !== 'mine') {
            field[randomRow][randomCol].type = 'mine';
            placedMines++;
        }
    }
}

function countNeighbourMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'mine') continue;

            let minesCount = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let neighborRow = r + i;
                    let neighborCol = c + j;

                    if (neighborRow >= 0 && neighborRow < gameState.rows && 
                        neighborCol >= 0 && neighborCol < gameState.cols) {
                        if (field[neighborRow][neighborCol].type === 'mine') {
                            minesCount++;
                        }
                    }
                }
            }
            field[r][c].neighborMines = minesCount;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== 'process') return;
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;

    let cell = field[row][col];
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    // Зміна стану та інкремент лічильника
    cell.state = 'opened';
    
    if (cell.type === 'mine') {
        gameState.status = 'lose';
        stopTimer();
        console.log("БУМ! Поразка.");
        return;
    }

    // Збільшуємо лічильник тільки для порожніх клітинок
    gameState.openedCells++; 

    if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) {
                    openCell(row + i, col + j);
                }
            }
        }
    }

    checkWinCondition(); 
}

function checkWinCondition() {
    const totalCellsToOpen = (gameState.rows * gameState.cols) - gameState.minesCount;
    
    if (gameState.openedCells === totalCellsToOpen) {
        gameState.status = 'win';
        stopTimer();
        console.log("ПЕРЕМОГА!");
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== 'process') return;
    let cell = field[row][col];
    if (cell.state === 'opened') return;

    cell.state = (cell.state === 'closed') ? 'flagged' : 'closed';
}

function startTimer() {
    if (gameState.timerId !== null) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId !== null) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function initGame() {
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.openedCells = 0;
    stopTimer();

    generateField(gameState.rows, gameState.cols, gameState.minesCount);
    countNeighbourMines();
    startTimer();

    console.log("Гру ініціалізовано. Умова перемоги: відкрити " + 
                (gameState.rows * gameState.cols - gameState.minesCount) + " клітинок.");
}

initGame();
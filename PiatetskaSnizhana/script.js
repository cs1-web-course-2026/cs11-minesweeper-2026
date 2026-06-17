// 1. Моделювання даних (Data Layer)
// Об'єкт стану гри, що зберігає глобальні параметри
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process', // 'process' | 'win' | 'lose'
    gameTime: 0,
    timerId: null,
    field: [] // Двовимірний масив поля
};

function generateField(rows, cols, minesCount) {
    gameState.field = [];
    
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

    let placedMines = 0;
    while (placedMines < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        
        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            placedMines++;
        }
    }

    countNeighbourMines();
}

// 3. Алгоритмічна частина (Business Logic)
function countNeighbourMines() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;

            let count = 0;
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    if (gameState.field[nr][nc].type === 'mine') {
                        count++;
                    }
                }
            }
            gameState.field[r][c].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== 'process') return;
    
    const cell = gameState.field[row][col];

    if (cell.state === 'opened' || cell.state === 'flagged') return;

    if (cell.type === 'mine') {
        gameState.status = 'lose';
        stopTimer();
        console.log("💥 Бум! Ви натрапили на міну. Гра завершена.");
        return;
    }
    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                openCell(nr, nc);
            }
        }
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== 'process') return;
    
    const cell = gameState.field[row][col];
    
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    gameState.gameTime = 0;
    
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

generateField(gameState.rows, gameState.cols, gameState.minesCount);
startTimer();
console.log("🏁 Гра запущена! Стан поля згенеровано.");

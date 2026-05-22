// 1. КОНСТАНТИ
const GAME_STATUS = {
    PROCESS: 'process',
    WIN: 'win',
    LOSE: 'lose'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const CELL_TYPE = {
    EMPTY: 'empty',
    MINE: 'mine'
};

// 2. ЄДИНИЙ ОБ'ЄКТ СТАНУ
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    openedCells: 0,
    timerId: null,
    board: []
};

// 3. ЧИСТІ ФУНКЦІЇ
function generateField(rows, cols, minesCount) {
    const newBoard = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: CELL_TYPE.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0
            });
        }
        newBoard.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        if (newBoard[randomRow][randomCol].type !== CELL_TYPE.MINE) {
            newBoard[randomRow][randomCol].type = CELL_TYPE.MINE;
            placedMines++;
        }
    }

    return newBoard;
}

function countNeighbourMines(board, rows, cols) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].type === CELL_TYPE.MINE) continue;

            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let neighborRow = r + i;
                    let neighborCol = c + j;

                    if (neighborRow >= 0 && neighborRow < rows &&
                        neighborCol >= 0 && neighborCol < cols) {
                        if (board[neighborRow][neighborCol].type === CELL_TYPE.MINE) {
                            count++;
                        }
                        }
                }
            }
            board[r][c].neighborMines = count;
        }
    }
}

function openCell(state, row, col) {
    if (state.status !== GAME_STATUS.PROCESS) return;
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return;

    let cell = state.board[row][col];
    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    // Зміна стану та інкремент лічильника
    cell.state = CELL_STATE.OPENED;

    if (cell.type === CELL_TYPE.MINE) {
        state.status = GAME_STATUS.LOSE;
        stopTimer(state);
        console.log("БУМ! Поразка.");
        return;
    }

    // Збільшуємо лічильник тільки для порожніх клітинок
    state.openedCells++;

    if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) {
                    openCell(state, row + i, col + j);
                }
            }
        }
    }

    checkWinCondition(state);
}

function checkWinCondition(state) {
    const totalCellsToOpen = (state.rows * state.cols) - state.minesCount;

    if (state.openedCells === totalCellsToOpen) {
        state.status = GAME_STATUS.WIN;
        stopTimer(state);
        console.log("ПЕРЕМОГА!");
    }
}

// 4. ПЕРЕВІРКА МЕЖ
function toggleFlag(state, row, col) {
    if (state.status !== GAME_STATUS.PROCESS) return;
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return;

    let cell = state.board[row][col];
    if (cell.state === CELL_STATE.OPENED) return;

    cell.state = (cell.state === CELL_STATE.CLOSED) ? CELL_STATE.FLAGGED : CELL_STATE.CLOSED;
}

function startTimer(state) {
    if (state.timerId !== null) return;
    state.timerId = setInterval(() => {
        state.gameTime++;
    }, 1000);
}

function stopTimer(state) {
    if (state.timerId !== null) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
}

function initGame(state) {
    state.status = GAME_STATUS.PROCESS;
    state.gameTime = 0;
    state.openedCells = 0;
    stopTimer(state);


    state.board = generateField(state.rows, state.cols, state.minesCount);
    countNeighbourMines(state.board, state.rows, state.cols);

    startTimer(state);

    console.log("Гру ініціалізовано. Умова перемоги: відкрити " +
    (state.rows * state.cols - state.minesCount) + " клітинок.");
}

initGame(gameState);
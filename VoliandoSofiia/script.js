// ========== СТАН ГРИ (GAME STATE) ==========
const GAME_STATUS = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

const DIFFICULTY_SETTINGS = {
    easy: { rows: 10, cols: 10, mines: 12 },
    hard: { rows: 16, cols: 16, mines: 40 }
};

const gameState = {
    rows: 10,
    cols: 10,
    totalMines: 12,
    board: [],
    status: GAME_STATUS.IDLE,
    flagsPlaced: 0,
    cellsRevealed: 0,
    timerId: null,
    seconds: 0
};

// ========== DOM ЕЛЕМЕНТИ ==========
const boardElement = document.getElementById('board');
const minesCountElement = document.getElementById('minesCount');
const timerElement = document.getElementById('timer');
const newGameButton = document.getElementById('newGameBtn');
const messageElement = document.getElementById('game-message');

// ========== ДОПОМІЖНІ ФУНКЦІЇ ==========
function updateMinesDisplay() {
    const remaining = gameState.totalMines - gameState.flagsPlaced;
    minesCountElement.textContent = String(remaining).padStart(3, '0');
}

function updateTimerDisplay() {
    timerElement.textContent = String(gameState.seconds).padStart(3, '0');
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function startTimer() {
    if (gameState.timerId) stopTimer();
    gameState.timerId = setInterval(() => {
        if (gameState.status === GAME_STATUS.PLAYING) {
            gameState.seconds++;
            updateTimerDisplay();
        }
    }, 1000);
}

function setGameStatus(status) {
    gameState.status = status;
    if (status === GAME_STATUS.WON) {
        stopTimer();
        messageElement.textContent = '🎉 Перемога! Ви виграли! 🎉';
    } else if (status === GAME_STATUS.LOST) {
        stopTimer();
        messageElement.textContent = '💥 Поразка! Ви програли! 💥';
    } else if (status === GAME_STATUS.IDLE) {
        messageElement.textContent = '';
    }
}

// ========== СТВОРЕННЯ ТА ГЕНЕРАЦІЯ ПОЛЯ ==========
function createEmptyBoard() {
    const newBoard = [];
    for (let row = 0; row < gameState.rows; row++) {
        newBoard[row] = [];
        for (let col = 0; col < gameState.cols; col++) {
            newBoard[row][col] = {
                mine: false,
                revealed: false,
                flagged: false,
                neighborMines: 0
            };
        }
    }
    return newBoard;
}

function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    while (minesPlaced < gameState.totalMines) {
        const row = Math.floor(Math.random() * gameState.rows);
        const col = Math.floor(Math.random() * gameState.cols);
        
        const isFirstClickArea = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
        
        if (!gameState.board[row][col].mine && !isFirstClickArea) {
            gameState.board[row][col].mine = true;
            minesPlaced++;
        }
    }
}

// ========== ПІДРАХУНОК СУСІДНІХ МІН ==========
function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].mine) continue;
            
            let mineCount = 0;
            
            for (let directionRow = -1; directionRow <= 1; directionRow++) {
                for (let directionCol = -1; directionCol <= 1; directionCol++) {
                    const neighbourRow = row + directionRow;
                    const neighbourCol = col + directionCol;
                    
                    const isValid = neighbourRow >= 0 && neighbourRow < gameState.rows &&
                                   neighbourCol >= 0 && neighbourCol < gameState.cols;
                    
                    if (isValid && gameState.board[neighbourRow][neighbourCol].mine) {
                        mineCount++;
                    }
                }
            }
            
            gameState.board[row][col].neighborMines = mineCount;
        }
    }
}

// ========== РЕКУРСИВНЕ ВІДКРИТТЯ КЛІТИНОК ==========
function openCell(row, col) {
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    
    const cell = gameState.board[row][col];
    
    if (cell.revealed) return;
    if (cell.flagged) return;
    
    cell.revealed = true;
    gameState.cellsRevealed++;
    
    if (cell.neighborMines === 0 && !cell.mine) {
        for (let directionRow = -1; directionRow <= 1; directionRow++) {
            for (let directionCol = -1; directionCol <= 1; directionCol++) {
                if (directionRow === 0 && directionCol === 0) continue;
                openCell(row + directionRow, col + directionCol);
            }
        }
    }
}

// ========== ПРАПОРЦІ ==========
function toggleFlag(row, col) {
    const cell = gameState.board[row][col];
    
    if (cell.revealed) return;
    
    if (!cell.flagged) {
        if (gameState.flagsPlaced < gameState.totalMines) {
            cell.flagged = true;
            gameState.flagsPlaced++;
        }
    } else {
        cell.flagged = false;
        gameState.flagsPlaced--;
    }
    
    updateMinesDisplay();
    renderBoard();
}

// ========== ПЕРЕВІРКА ПЕРЕМОГИ ==========
function checkWinCondition() {
    let allSafeRevealed = true;
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            if (!cell.mine && !cell.revealed) {
                allSafeRevealed = false;
                break;
            }
        }
    }
    
    if (allSafeRevealed) {
        setGameStatus(GAME_STATUS.WON);
        renderBoard();
    }
}

// ========== ОБРОБКА КЛІКІВ ==========
function handleCellClick(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING && gameState.status !== GAME_STATUS.IDLE) return;
    
    const cell = gameState.board[row][col];
    
    if (cell.flagged) return;
    
    if (gameState.status === GAME_STATUS.IDLE) {
        gameState.status = GAME_STATUS.PLAYING;
        placeMines(row, col);
        countNeighbourMines();
        startTimer();
    }
    
    if (cell.mine) {
        cell.revealed = true;
        setGameStatus(GAME_STATUS.LOST);
        revealAllMines();
        renderBoard();
        return;
    }
    
    openCell(row, col);
    renderBoard();
    checkWinCondition();
}

function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.board[row][col].mine) {
                gameState.board[row][col].revealed = true;
            }
        }
    }
}

// ========== ВІДМАЛЬОВУВАННЯ ДОШКИ ==========
function renderBoard() {
    if (!boardElement) return;
    
    boardElement.innerHTML = '';
    boardElement.style.setProperty('--board-columns', gameState.cols);
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cell';
            
            let stateLabel = 'closed';
            
            if (cell.revealed) {
                button.classList.add('open');
                if (cell.mine) {
                    button.classList.add('mine');
                    button.textContent = '💣';
                    stateLabel = 'mine';
                } else if (cell.neighborMines > 0) {
                    button.textContent = cell.neighborMines;
                    button.setAttribute('data-number', cell.neighborMines);
                    stateLabel = `${cell.neighborMines} adjacent mines`;
                } else {
                    stateLabel = 'empty';
                }
            } else {
                button.classList.add('closed');
                if (cell.flagged) {
                    button.classList.add('flag');
                    button.textContent = '🚩';
                    stateLabel = 'flagged';
                } else {
                    stateLabel = 'closed';
                }
            }
            
            button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${stateLabel}`);
            
            button.addEventListener('click', (function(currentRow, currentCol) {
                return function() { handleCellClick(currentRow, currentCol); };
            })(row, col));
            
            button.addEventListener('contextmenu', (function(currentRow, currentCol) {
                return function(event) {
                    event.preventDefault();
                    if (gameState.status === GAME_STATUS.PLAYING) {
                        toggleFlag(currentRow, currentCol);
                    }
                };
            })(row, col));
            
            boardElement.appendChild(button);
        }
    }
}

// ========== ІНІЦІАЛІЗАЦІЯ НОВОЇ ГРИ ==========
function initGame() {
    gameState.status = GAME_STATUS.IDLE;
    gameState.flagsPlaced = 0;
    gameState.cellsRevealed = 0;
    gameState.seconds = 0;
    
    stopTimer();
    updateTimerDisplay();
    messageElement.textContent = '';
    
    gameState.board = createEmptyBoard();
    updateMinesDisplay();
    renderBoard();
    setGameStatus(GAME_STATUS.IDLE);
}

// ========== ЗМІНА СКЛАДНОСТІ ==========
function setDifficulty(newRows, newCols, newMines) {
    gameState.rows = newRows;
    gameState.cols = newCols;
    gameState.totalMines = newMines;
    initGame();
}

// ========== ОБРОБНИКИ ПОДІЙ ==========
if (newGameButton) {
    newGameButton.addEventListener('click', initGame);
}

document.querySelectorAll('.difficulty button').forEach((difficultyButton) => {
    difficultyButton.addEventListener('click', () => {
        document.querySelectorAll('.difficulty button').forEach((button) => {
            button.classList.remove('active');
        });
        difficultyButton.classList.add('active');
        
        const difficultyKey = difficultyButton.dataset.diff;
        const { rows, cols, mines } = DIFFICULTY_SETTINGS[difficultyKey];
        setDifficulty(rows, cols, mines);
    });
});

document.addEventListener('DOMContentLoaded', initGame);

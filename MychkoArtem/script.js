// ==========================================
// 1. DOM ЕЛЕМЕНТИ
// ==========================================
const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const minesCounterElement = document.getElementById('mines-counter');
const restartBtn = document.getElementById('btn-restart');
// Знайшли елемент для сповіщень скрінрідера
const liveStatusElement = document.getElementById('game-status');

// ==========================================
// 2. МОДЕЛЮВАННЯ ДАНИХ
// ==========================================
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

const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    flagsPlaced: 0,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    openedCells: 0,
    timerId: null,
    isFirstClick: true,
    board: []
};

// ==========================================
// 3. ЛОГІКА ГРИ ТА АЛГОРИТМИ
// ==========================================
function generateField(excludeRow, excludeCol) {
    let placedMines = 0;
    while (placedMines < gameState.minesCount) {
        let r = Math.floor(Math.random() * gameState.rows);
        let c = Math.floor(Math.random() * gameState.cols);

        // Гарантуємо, що міна не з'явиться там, куди клікнув гравець
        if (r === excludeRow && c === excludeCol) continue;

        if (gameState.board[r][c].type !== CELL_TYPE.MINE) {
            gameState.board[r][c].type = CELL_TYPE.MINE;
            placedMines++;
        }
    }
    countNeighbourMines(); // Рахуємо сусідів відразу після розміщення мін
}

function countNeighbourMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.board[r][c].type === CELL_TYPE.MINE) continue;
            let minesCount = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nRow = r + i, nCol = c + j;
                    if (nRow >= 0 && nRow < gameState.rows && nCol >= 0 && nCol < gameState.cols) {
                        if (gameState.board[nRow][nCol].type === CELL_TYPE.MINE) minesCount++;
                    }
                }
            }
            gameState.board[r][c].neighborMines = minesCount;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;

    let cell = gameState.board[row][col];
    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    cell.state = CELL_STATE.OPENED;
    updateSingleCellDOM(row, col);

    if (cell.type === CELL_TYPE.MINE) {
        gameState.status = GAME_STATUS.LOSE;
        stopTimer();
        revealAllMines();

        if (liveStatusElement) liveStatusElement.textContent = 'Ви програли! Підірвано міну.';
        showCustomModal("БУМ! Ти підірвався на міні. 💣", "lose");
        return;
    }

    gameState.openedCells++;

    if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) openCell(row + i, col + j);
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;

    let cell = gameState.board[row][col];
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
        gameState.flagsPlaced++;
    } else {
        cell.state = CELL_STATE.CLOSED;
        gameState.flagsPlaced--;
    }

    updateSingleCellDOM(row, col);
    updateUI();
}

function checkWinCondition() {
    const totalCellsToOpen = (gameState.rows * gameState.cols) - gameState.minesCount;
    if (gameState.openedCells === totalCellsToOpen) {
        gameState.status = GAME_STATUS.WIN;
        stopTimer();

        if (liveStatusElement) liveStatusElement.textContent = `Вітаємо! Ви перемогли! Ваш час: ${gameState.gameTime} секунд.`;
        showCustomModal(`ПЕРЕМОГА! 🏆 Твій час: ${gameState.gameTime} сек.`, "win");
    }
}

function revealAllMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.board[r][c].type === CELL_TYPE.MINE) {
                gameState.board[r][c].state = CELL_STATE.OPENED;
                updateSingleCellDOM(r, c);
            }
        }
    }
}

// ==========================================
// 4. ТОЧКОВА РОБОТА З DOM
// ==========================================
const mineTemplate = document.getElementById('tpl-mine');
const flagTemplate = document.getElementById('tpl-flag');

function initBoardDOM() {
    boardElement.innerHTML = '';
    boardElement.style.setProperty('--cols', gameState.cols);
    boardElement.style.setProperty('--rows', gameState.rows);

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('cell');
            btn.dataset.row = r;
            btn.dataset.col = c;

            gameState.board[r][c].element = btn;

            btn.setAttribute('aria-label', `Закрита клітинка, рядок ${r + 1}, колонка ${c + 1}`);
            boardElement.appendChild(btn);
        }
    }
}

function updateSingleCellDOM(r, c) {
    const cellData = gameState.board[r][c];
    const btn = cellData.element;
    if (!btn) return;

    btn.className = 'cell';
    btn.innerHTML = '';

    if (cellData.state === CELL_STATE.OPENED) {
        btn.classList.add('cell--open');
        if (cellData.type === CELL_TYPE.MINE) {
            btn.classList.add(gameState.status === GAME_STATUS.LOSE ? 'cell--exploded' : 'cell--mine-revealed');
            btn.appendChild(mineTemplate.content.cloneNode(true));
            btn.setAttribute('aria-label', `Міна, рядок ${r + 1}, колонка ${c + 1}`);
        } else if (cellData.neighborMines > 0) {
            btn.textContent = cellData.neighborMines;
            btn.dataset.value = cellData.neighborMines;
            btn.setAttribute('aria-label', `${cellData.neighborMines} сусідніх мін, рядок ${r + 1}, колонка ${c + 1}`);
        } else {
            btn.setAttribute('aria-label', `Відкрита порожня клітинка, рядок ${r + 1}, колонка ${c + 1}`);
        }
    }
    else if (cellData.state === CELL_STATE.FLAGGED) {
        btn.classList.add('cell--flag');
        btn.appendChild(flagTemplate.content.cloneNode(true));
        btn.setAttribute('aria-label', `Прапорець, рядок ${r + 1}, колонка ${c + 1}`);
    } else {
        btn.setAttribute('aria-label', `Закрита клітинка, рядок ${r + 1}, колонка ${c + 1}`);
    }
}

function updateUI() {
    let minesLeft = gameState.minesCount - gameState.flagsPlaced;
    let displayValue = minesLeft < 0 ? '-' + String(Math.abs(minesLeft)).padStart(2, '0') : String(minesLeft).padStart(3, '0');
    minesCounterElement.textContent = displayValue;
    timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
}

function showCustomModal(message, type) {
    const existingModal = document.getElementById('game-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'game-modal';
    modal.classList.add('modal-overlay');

    const content = document.createElement('div');
    content.classList.add('modal-content');
    content.classList.add(type === 'win' ? 'modal-content--win' : 'modal-content--lose');

    content.innerHTML = `
    <h2>${message}</h2>
    <button type="button" id="modal-restart" class="btn-modal">Почати заново</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('modal-restart').addEventListener('click', () => {
        modal.remove();
        initGame();
    });
}

// ==========================================
// 5. ПОДІЇ КОРИСТУВАЧА
// ==========================================

boardElement.addEventListener('click', (event) => {
    const btn = event.target.closest('.cell');
    if (!btn) return;

    const r = parseInt(btn.dataset.row);
    const c = parseInt(btn.dataset.col);

    if (gameState.isFirstClick) {
        gameState.isFirstClick = false;
        generateField(r, c);
        startTimer();
    }
    openCell(r, c);
});

boardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const btn = e.target.closest('.cell');
    if (!btn) return;

    const r = parseInt(btn.dataset.row);
    const c = parseInt(btn.dataset.col);

    toggleFlag(r, c);
});

restartBtn.addEventListener('click', () => {
    const modal = document.getElementById('game-modal');
    if (modal) modal.remove();
    initGame();
});

// ==========================================
// 6. ТАЙМЕР ТА СТАРТ ГРИ
// ==========================================
function startTimer() {
    if (gameState.timerId !== null) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        updateUI();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId !== null) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function initGame() {
    gameState.status = GAME_STATUS.PROCESS;
    gameState.gameTime = 0;
    gameState.openedCells = 0;
    gameState.flagsPlaced = 0;
    gameState.isFirstClick = true; // Скидаємо прапорець першого кліку
    stopTimer();

    if (liveStatusElement) liveStatusElement.textContent = 'Нова гра почалася.';

    // Створюємо порожнє поле без мін (всередині gameState)
    gameState.board = Array.from({length: gameState.rows}, () =>
    Array.from({length: gameState.cols}, () => ({ type: CELL_TYPE.EMPTY, state: CELL_STATE.CLOSED, neighborMines: 0 }))
    );

    initBoardDOM();
    updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initGame(); // Чекаємо, поки весь HTML завантажиться, і лише тоді запускаємо JS
});

// 1. СТАН ГРИ (DATA LAYER)
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    flagsPlaced: 0,
    status: 'process', // 'process' | 'win' | 'lose'
    gameTime: 0,
    timerId: null,
    field: []
};

// Зв'язок з HTML елементами
const boardEl = document.getElementById('board');
const flagsCountEl = document.getElementById('flags-count');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');

// 2. ГЕНЕРАЦІЯ ЛОГІКИ
function initGame() {
    gameState.status = 'process';
    gameState.flagsPlaced = 0;
    gameState.gameTime = 0;
    stopTimer();
    updateHeader();
    startBtn.textContent = '😃';

    // Створення порожнього поля
    gameState.field = [];
    for (let r = 0; r < gameState.rows; r++) {
        const row = [];
        for (let c = 0; c < gameState.cols; c++) {
            row.push({ type: 'empty', state: 'closed', neighborMines: 0 });
        }
        gameState.field.push(row);
    }

    // Розстановка мін випадковим чином
    let placed = 0;
    while (placed < gameState.minesCount) {
        const r = Math.floor(Math.random() * gameState.rows);
        const c = Math.floor(Math.random() * gameState.cols);
        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            placed++;
        }
    }

    // Підрахунок мін навколо порожніх клітинок
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;
            let count = 0;
            for (let [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    if (gameState.field[nr][nc].type === 'mine') count++;
                }
            }
            gameState.field[r][c].neighborMines = count;
        }
    }

    renderBoard();
    startTimer();
}

// 3. РОБОТА З DOM (ВІДОБРАЖЕННЯ)
function renderBoard() {
    boardEl.innerHTML = '';
    // Динамічно налаштовуємо сітку CSS Grid
    boardEl.style.gridTemplateColumns = `repeat(${gameState.cols}, 40px)`;
    boardEl.style.gridTemplateRows = `repeat(${gameState.rows}, 40px)`;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellData = gameState.field[r][c];
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');

            // Обробка кліків
            cellEl.addEventListener('click', () => handleLeftClick(r, c));
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Блокуємо стандартне меню браузера
                handleRightClick(r, c);
            });

            // Відображення різних станів клітинки
            if (cellData.state === 'opened') {
                cellEl.classList.add('revealed');
                if (cellData.type === 'mine') {
                    cellEl.classList.add('mine');
                    cellEl.textContent = '💣';
                    if (gameState.status === 'lose') cellEl.classList.add('exploded');
                } else if (cellData.neighborMines > 0) {
                    cellEl.textContent = cellData.neighborMines;
                    const colors = ['', 'blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'];
                    cellEl.style.color = colors[cellData.neighborMines];
                }
            } else if (cellData.state === 'flagged') {
                cellEl.classList.add('flag');
                cellEl.textContent = '🚩';
            }

            boardEl.appendChild(cellEl);
        }
    }
    updateHeader();
}

// 4. ОБРОБКА ПОДІЙ КОРИСТУВАЧА
function handleLeftClick(r, c) {
    if (gameState.status !== 'process') return;
    const cell = gameState.field[r][c];
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    if (cell.type === 'mine') {
        gameState.status = 'lose';
        startBtn.textContent = '😵'; // Міняємо емоцію на програш
        revealAllMines();
        stopTimer();
    } else {
        openCellRecursive(r, c);
        checkWin();
    }
    renderBoard();
}

function handleRightClick(r, c) {
    if (gameState.status !== 'process') return;
    const cell = gameState.field[r][c];
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
        gameState.flagsPlaced++;
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
        gameState.flagsPlaced--;
    }
    renderBoard();
}

// Рекурсивне відкриття порожніх клітинок
function openCellRecursive(r, c) {
    const cell = gameState.field[r][c];
    if (cell.state !== 'closed') return;
    
    cell.state = 'opened';
    
    if (cell.neighborMines === 0) {
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (let [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                openCellRecursive(nr, nc);
            }
        }
    }
}

// 5. ДОПОМІЖНІ ФУНКЦІЇ (Перемога/Поразка/Таймер)
function revealAllMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') {
                gameState.field[r][c].state = 'opened';
            }
        }
    }
}

function checkWin() {
    let closedSafeCells = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = gameState.field[r][c];
            if (cell.type !== 'mine' && cell.state !== 'opened') {
                closedSafeCells++;
            }
        }
    }
    if (closedSafeCells === 0) {
        gameState.status = 'win';
        startBtn.textContent = '😎'; // Емоція перемоги
        stopTimer();
        setTimeout(() => alert("Перемога! Ти справжній чемпіон! 🏆"), 100);
    }
}

function updateHeader() {
    const remainingFlags = gameState.minesCount - gameState.flagsPlaced;
    flagsCountEl.textContent = String(remainingFlags).padStart(3, '0');
    timerEl.textContent = String(gameState.gameTime).padStart(3, '0');
}

function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        updateHeader();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

// Перезапуск гри по кліку на смайлик
startBtn.addEventListener('click', initGame);

// Запуск першої гри при відкритті сторінки
initGame();
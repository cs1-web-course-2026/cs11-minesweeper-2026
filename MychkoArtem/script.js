// ==========================================
// 1. DOM ЕЛЕМЕНТИ
// ==========================================
const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const minesCounterElement = document.getElementById('mines-counter');
const restartBtn = document.getElementById('btn-restart');

// ==========================================
// 2. МОДЕЛЮВАННЯ ДАНИХ
// ==========================================
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    flagsPlaced: 0,
    status: 'process', 
    gameTime: 0,
    openedCells: 0,
    timerId: null,
    isFirstClick: true
};

let field = []; 

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

        if (field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            placedMines++;
        }
    }
    countNeighbourMines(); // Рахуємо сусідів відразу після розміщення мін
}

function countNeighbourMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'mine') continue;
            let minesCount = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nRow = r + i, nCol = c + j;
                    if (nRow >= 0 && nRow < gameState.rows && nCol >= 0 && nCol < gameState.cols) {
                        if (field[nRow][nCol].type === 'mine') minesCount++;
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

    cell.state = 'opened';
    updateSingleCellDOM(row, col);
    
    if (cell.type === 'mine') {
        gameState.status = 'lose';
        stopTimer();
        revealAllMines(); 
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
    if (gameState.status !== 'process') return;
    let cell = field[row][col];
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
        gameState.flagsPlaced++;
    } else {
        cell.state = 'closed';
        gameState.flagsPlaced--;
    }
    
    updateSingleCellDOM(row, col);
    updateUI();
}

function checkWinCondition() {
    const totalCellsToOpen = (gameState.rows * gameState.cols) - gameState.minesCount;
    if (gameState.openedCells === totalCellsToOpen) {
        gameState.status = 'win';
        stopTimer();
        showCustomModal(`ПЕРЕМОГА! 🏆 Твій час: ${gameState.gameTime} сек.`, "win");
    }
}

function revealAllMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'mine') {
                field[r][c].state = 'opened'; 
                updateSingleCellDOM(r, c); 
            }
        }
    }
}

// ==========================================
// 4. ТОЧКОВА РОБОТА З DOM (Surgical Updates)
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
            btn.classList.add('cell');
            btn.dataset.row = r;
            btn.dataset.col = c;
            
            field[r][c].element = btn; 
            
            btn.setAttribute('aria-label', `Закрита клітинка, рядок ${r + 1}, колонка ${c + 1}`);
            boardElement.appendChild(btn);
        }
    }
}

function updateSingleCellDOM(r, c) {
    const cellData = field[r][c];
    const btn = cellData.element;
    if (!btn) return;

    btn.className = 'cell';
    btn.innerHTML = '';

    if (cellData.state === 'opened') {
        btn.classList.add('cell--open');
        if (cellData.type === 'mine') {
            btn.classList.add(gameState.status === 'lose' ? 'cell--exploded' : 'cell--mine-revealed');
            btn.appendChild(mineTemplate.content.cloneNode(true));
        } else if (cellData.neighborMines > 0) {
            btn.textContent = cellData.neighborMines;
            btn.dataset.value = cellData.neighborMines; 
        }
    } 
    else if (cellData.state === 'flagged') {
        btn.classList.add('cell--flag');
        btn.appendChild(flagTemplate.content.cloneNode(true));
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
        <button id="modal-restart" class="btn-modal">Почати заново</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('modal-restart').addEventListener('click', () => {
        modal.remove();
        initGame();
    });
}

// ==========================================
// 5. ПОДІЇ КОРИСТУВАЧА (СЕМАНТИЧНИЙ ПІДХІД)
// ==========================================
boardElement.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; 

    const btn = e.target.closest('.cell');
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
    e.preventDefault(); // Блокуємо системне меню
    
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
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.openedCells = 0;
    gameState.flagsPlaced = 0;
    gameState.isFirstClick = true; // Скидаємо прапорець першого кліку
    stopTimer();

    // Створюємо порожнє поле без мін
    field = Array.from({length: gameState.rows}, () => 
        Array.from({length: gameState.cols}, () => ({ type: 'empty', state: 'closed', neighborMines: 0 }))
    );

    initBoardDOM(); 
    updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initGame(); // Чекаємо, поки весь HTML завантажиться, і лише тоді запускаємо JS
});
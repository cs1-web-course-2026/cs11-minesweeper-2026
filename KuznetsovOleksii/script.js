const gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: []
};

function initGame() {
    gameState.field = [];
    for (let r = 0; r < gameState.rows; r++) {
        const row = [];
        for (let c = 0; c < gameState.cols; c++) {
            row.push({
                type: 'empty',
                state: 'closed',
                neighborMines: 0
            });
        }
        gameState.field.push(row);
    }

    let minesPlaced = 0;
    while (minesPlaced < gameState.minesCount) {
        let r = Math.floor(Math.random() * gameState.rows);
        let c = Math.floor(Math.random() * gameState.cols);
        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            minesPlaced++;
        }
    }

    countNeighbors();
    startTimer();
    renderField();
}

function countNeighbors() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr;
                    let nc = c + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (gameState.field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            gameState.field[r][c].neighborMines = count;
        }
    }
}

function openCell(r, c) {
    const cell = gameState.field[r][c];
    if (cell.state !== 'closed' || gameState.status !== 'process') return;

    if (cell.type === 'mine') {
        cell.state = 'opened';
        gameState.status = 'lose';
        clearInterval(gameState.timerId);
        renderField();
        return;
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr;
                let nc = c + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    openCell(nr, nc);
                }
            }
        }
    }
    checkWin();
}

function toggleFlag(r, c) {
    const cell = gameState.field[r][c];
    if (gameState.status !== 'process') return;
    if (cell.state === 'closed') cell.state = 'flagged';
    else if (cell.state === 'flagged') cell.state = 'closed';
}

function checkWin() {
    let openedCount = 0;
    gameState.field.forEach(row => {
        row.forEach(cell => {
            if (cell.state === 'opened' && cell.type !== 'mine') openedCount++;
        });
    });

    if (openedCount === (gameState.rows * gameState.cols) - gameState.minesCount) {
        gameState.status = 'win';
        clearInterval(gameState.timerId);
        document.querySelector('.restart').textContent = '😎';
    }
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        const timerElement = document.querySelector('.timer');
        if (timerElement) timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
    }, 1000);
}

function renderField() {
    const fieldContainer = document.querySelector('.field');
    if (!fieldContainer) return;
    fieldContainer.innerHTML = '';

    gameState.field.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');

            if (cell.state === 'closed') {
                cellDiv.classList.add('closed');
            } else if (cell.state === 'flagged') {
                cellDiv.classList.add('closed', 'flag');
            } else if (cell.state === 'opened') {
                cellDiv.classList.add('open');
                if (cell.type === 'mine') {
                    cellDiv.classList.add('mine');
                    if (gameState.status === 'lose') cellDiv.classList.add('clicked');
                } else if (cell.neighborMines > 0) {
                    cellDiv.textContent = cell.neighborMines;
                    cellDiv.setAttribute('data-number', cell.neighborMines);
                }
            }

            cellDiv.addEventListener('click', () => {
                openCell(r, c);
                renderField();
            });

            cellDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(r, c);
                renderField();
            });

            fieldContainer.appendChild(cellDiv);
        });
    });

    const counter = document.querySelector('.counter');
    const flagsCount = gameState.field.flat().filter(cell => cell.state === 'flagged').length;
    if (counter) counter.textContent = `🚩 ${gameState.minesCount - flagsCount}`;
    
    if (gameState.status === 'lose') document.querySelector('.restart').textContent = '😵';
}

document.querySelector('.restart').addEventListener('click', () => {
    gameState.status = 'process';
    gameState.gameTime = 0;
    document.querySelector('.restart').textContent = '🙂';
    initGame();
});

initGame();
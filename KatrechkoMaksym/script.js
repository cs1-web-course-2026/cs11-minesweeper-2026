const gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: []
};

const fieldElement = document.getElementById('minefield');
const timerDisplay = document.getElementById('timer');
const mineDisplay = document.getElementById('mine-count');

function initGame() {
    gameState.status = 'process';
    gameState.gameTime = 0;
    clearInterval(gameState.timerId);
    
    // Генерація поля
    gameState.field = Array.from({ length: gameState.rows }, () =>
        Array.from({ length: gameState.cols }, () => ({
            type: 'empty', state: 'closed', neighborMines: 0
        }))
    );

    // Розстановка мін
    let placed = 0;
    while (placed < gameState.minesCount) {
        let r = Math.floor(Math.random() * gameState.rows);
        let c = Math.floor(Math.random() * gameState.cols);
        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            placed++;
        }
    }

    calculateNeighbors();
    startTimer();
    render();
}

function calculateNeighbors() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = r + i, nc = c + j;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (gameState.field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            gameState.field[r][c].neighborMines = count;
        }
    }
}

function render() {
    fieldElement.innerHTML = '';
    gameState.field.forEach((row, r) => {
        row.forEach((cell, c) => {
            const div = document.createElement('div');
            div.classList.add('cell');
            if (cell.state === 'opened') {
                div.classList.add('open');
                if (cell.type === 'mine') {
                    div.innerHTML = '💣';
                    if (gameState.status === 'lose') div.classList.add('exploded');
                } else if (cell.neighborMines > 0) {
                    div.innerHTML = `<span class="n${cell.neighborMines}">${cell.neighborMines}</span>`;
                }
            } else if (cell.state === 'flagged') {
                div.innerHTML = '🚩';
            }

            div.onclick = () => openCell(r, c);
            div.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); };
            fieldElement.appendChild(div);
        });
    });
}

function openCell(r, c) {
    if (gameState.status !== 'process') return;
    const cell = gameState.field[r][c];
    if (cell.state !== 'closed') return;

    if (cell.type === 'mine') {
        gameState.status = 'lose';
        clearInterval(gameState.timerId);
        revealMines();
    } else {
        cell.state = 'opened';
        if (cell.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = r + i, nc = c + j;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) openCell(nr, nc);
                }
            }
        }
    }
    render();
}

function toggleFlag(r, c) {
    const cell = gameState.field[r][c];
    if (cell.state === 'opened') return;
    cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
    render();
}

function revealMines() {
    gameState.field.forEach(row => row.forEach(c => { if(c.type === 'mine') c.state = 'opened'; }));
}

function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        timerDisplay.innerText = String(gameState.gameTime).padStart(3, '0');
    }, 1000);
}

document.querySelector('.new-game-btn').onclick = initGame;
initGame();

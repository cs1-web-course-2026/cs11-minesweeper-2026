const gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: [],
    flagsUsed: 0
};

function initGame() {
    stopTimer();
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.flagsUsed = 0;
    gameState.timerId = null;
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('flags-count').innerText = "0";
    generateField(gameState.rows, gameState.cols, gameState.minesCount);
    render();
}

function generateField(rows, cols, minesCount) {
    gameState.field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ type: 'empty', state: 'closed', neighborMines: 0, r, c });
        }
        gameState.field.push(row);
    }

    let placed = 0;
    while (placed < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            placed++;
        }
    }
    countNeighbourMines();
}

function countNeighbourMines() {
    const { rows, cols, field } = gameState;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (field[r][c].type === 'mine') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && field[nr][nc].type === 'mine') count++;
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

function render() {
    const fieldContainer = document.getElementById('game-field');
    fieldContainer.innerHTML = '';

    gameState.field.forEach((rowArr) => {
        const rowView = document.createElement('div');
        rowView.className = 'BlocksInRow';

        rowArr.forEach((cell) => {
            const cellView = document.createElement('div');

            if (cell.state === 'closed') {
                cellView.className = 'BlueBox';
            } else if (cell.state === 'flagged') {
                cellView.className = 'BoxFlag';
                cellView.innerText = '🚩';
            } else if (cell.state === 'opened') {
                if (cell.type === 'mine') {
                    cellView.className = 'WhiteBox mine-cell';
                    cellView.innerText = '💣';
                } else if (cell.neighborMines > 0) {
                    const n = Math.min(cell.neighborMines, 8);
                    cellView.className = `BoxNumber${n}`;
                    cellView.innerText = cell.neighborMines;
                } else {
                    cellView.className = 'WhiteBox';
                }
            }

            cellView.addEventListener('click', () => {
                if (gameState.status !== 'process') return;
                openCell(cell.r, cell.c);
                render();
            });

            cellView.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (gameState.status !== 'process') return;
                toggleFlag(cell.r, cell.c);
                render();
            });

            rowView.appendChild(cellView);
        });
        fieldContainer.appendChild(rowView);
    });

    document.getElementById('flags-count').innerText = gameState.flagsUsed;
}

function openCell(r, c) {
    const cell = gameState.field[r][c];
    if (cell.state !== 'closed') return;

    if (!gameState.timerId && gameState.status === 'process') startTimer();

    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
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
    if (cell.state === 'opened') return;
    if (cell.state === 'flagged') {
        cell.state = 'closed';
        gameState.flagsUsed--;
    } else if (gameState.flagsUsed < gameState.minesCount) {
        cell.state = 'flagged';
        gameState.flagsUsed++;
    }
}

function startTimer() {
    if (gameState.timerId) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        const mins = Math.floor(gameState.gameTime / 60).toString().padStart(2, '0');
        const secs = (gameState.gameTime % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function checkWin() {
    let closedEmpty = 0;
    gameState.field.forEach(row => row.forEach(cell => {
        if (cell.type === 'empty' && cell.state !== 'opened') closedEmpty++;
    }));
    if (closedEmpty === 0) endGame('win');
}

function endGame(result) {
    gameState.status = result;
    stopTimer();
    gameState.field.forEach(row => row.forEach(c => {
        if (c.type === 'mine') c.state = 'opened';
    }));
    render();
    setTimeout(() => {
        if (result === 'win') {
            alert('🎉 Перемога! Час: ' + document.getElementById('timer-display').innerText);
        } else {
            alert('💥 Бум! Ви програли. Натисніть на смайлик або "New Game" щоб спробувати знову.');
        }
    }, 200);
}

window.onload = initGame;

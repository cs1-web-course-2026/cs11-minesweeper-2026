window.addEventListener('DOMContentLoaded', () => {
    const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };
    const CELL_TYPE = { MINE: 'mine', EMPTY: 'empty' };
    const GAME_STATUS = { PLAYING: 'process', WON: 'win', LOST: 'lose' };

    // 1. Моделювання даних (Data Layer)
    const gameState = {
        rows: 10,
        cols: 10,
        minesCount: 16,
        status: GAME_STATUS.PLAYING,
        gameTime: 0,
        timerID: null,
        field: []
    };

    const timerRightElement = document.querySelector('.TimeNumRight');
    const flagCountElement = document.querySelector('.FlagCount');
    const numLeftElement = document.querySelector('.TimeNumLeft');
    const gameContainer = document.querySelector('.Game');
    const restartButton = document.querySelector('.Button');
    const gameMessageElement = document.getElementById('GameMessage');

    function updateTimerDisplay() {
        if (timerRightElement) timerRightElement.textContent = String(gameState.gameTime).padStart(3, '0');
    }

    function updateFlagCount() {
        const flagCount = gameState.field.flat().filter(c => c.state === CELL_STATE.FLAGGED).length;
        const flagsRemained = gameState.minesCount - flagCount;
        if (flagCountElement) flagCountElement.textContent = `Кількість прапорців: ${flagsRemained}`;
        if (numLeftElement) numLeftElement.textContent = String(Math.max(0, flagsRemained)).padStart(3, '0');
    }

    // Рендер строго через DIV, щоб підтягнувся твій CSS
    function render() {
        if (!gameContainer) return;
        gameContainer.innerHTML = '';

        gameState.field.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'CellRow';

            row.forEach((cell, colIndex) => {
                const cellDiv = document.createElement('div');

                if (cell.state === CELL_STATE.CLOSED) {
                    cellDiv.className = 'EmptyCell';
                } else if (cell.state === CELL_STATE.FLAGGED) {
                    cellDiv.className = 'FlagCell';
                } else if (cell.state === CELL_STATE.OPENED) {
                    if (cell.type === CELL_TYPE.MINE) {
                        cellDiv.className = 'BombCell';
                    } else {
                        cellDiv.className = 'EmptyCellOpened';
                        if (cell.neighbourMines > 0) {
                            cellDiv.innerHTML = `<p class="NumCell">${cell.neighbourMines}</p>`;
                        }
                    }
                }

                cellDiv.addEventListener('click', () => { openCell(rowIndex, colIndex); render(); });
                cellDiv.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(rowIndex, colIndex); render(); });
                rowDiv.appendChild(cellDiv);
            });
            gameContainer.appendChild(rowDiv);
        });
        updateFlagCount();
    }

    // 2. Генерація поля та мін
    function generateField(rows, cols, minesCount) {
        gameState.field = [];
        for (let r = 0; r < rows; r++) {
            const rowCells = [];
            for (let c = 0; c < cols; c++) {
                rowCells.push({ type: CELL_TYPE.EMPTY, state: CELL_STATE.CLOSED, neighbourMines: 0, row: r, col: c });
            }
            gameState.field.push(rowCells);
        }

        let placedMines = 0;
        while (placedMines < minesCount) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (gameState.field[r][c].type !== CELL_TYPE.MINE) {
                gameState.field[r][c].type = CELL_TYPE.MINE;
                placedMines++;
            }
        }
        countNeighbourMines();
    }

    // 3. Алгоритмічна частина
    function countNeighbourMines() {
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (gameState.field[r][c].type === CELL_TYPE.MINE) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                            if (gameState.field[nr][nc].type === CELL_TYPE.MINE) count++;
                        }
                    }
                }
                gameState.field[r][c].neighbourMines = count;
            }
        }
    }

    function openCell(row, col) {
        const cell = gameState.field[row][col];
        if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PLAYING) return;

        if (cell.type === CELL_TYPE.MINE) {
            cell.state = CELL_STATE.OPENED;
            endGame(GAME_STATUS.LOST);
            return;
        }

        cell.state = CELL_STATE.OPENED;

        if (cell.neighbourMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr, nc = col + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        openCell(nr, nc);
                    }
                }
            }
        }
        checkWin();
    }

    function toggleFlag(row, col) {
        const cell = gameState.field[row][col];
        if (cell.state === CELL_STATE.OPENED || gameState.status !== GAME_STATUS.PLAYING) return;
        cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
        updateFlagCount();
    }

    // 4. Інтерактив та таймер
  function startTimer() {
    if (gameState.timerID) {
      clearInterval(gameState.timerID);
    }
    gameState.gameTime = 0;
    updateTimerDisplay();
    gameState.timerID = setInterval(() => { 
      gameState.gameTime++; 
      updateTimerDisplay(); 
    }, 1000);
  }

    function checkWin() {
        let closedEmptyCells = 0;
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                if (gameState.field[row][col].type === CELL_TYPE.EMPTY && gameState.field[row][col].state !== CELL_STATE.OPENED) {
                    closedEmptyCells++;
                }
            }
        }
        if (closedEmptyCells === 0) endGame(GAME_STATUS.WON);
    }

    function endGame(result) {
        gameState.status = result;
        clearInterval(gameState.timerID);
        if (result === GAME_STATUS.LOST) {
            if (gameMessageElement) gameMessageElement.textContent = 'Ви підірвалися! Гра закінчена.';
        } else {
            if (gameMessageElement) gameMessageElement.textContent = 'Вітаємо, ви виграли!';
        }
        setTimeout(() => {
            if (gameMessageElement) gameMessageElement.textContent = '';
            initGame();
            render();
        }, 3000);
    }

    function initGame() {
        if (gameState.timerID) {
          clearInterval(gameState.timerID);
          gameState.timerID = null;
        }
        gameState.status = GAME_STATUS.PLAYING;
        generateField(gameState.rows, gameState.cols, gameState.minesCount);
        updateTimerDisplay();
        startTimer();
      }

    if (restartButton) {
        restartButton.addEventListener('click', () => { initGame(); render(); });
    }

    // Точка входу — запускаємо все разом
    initGame();
    render();
});
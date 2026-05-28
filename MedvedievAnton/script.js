const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process',
    gameTime: 0,
    timerId: null,
};

let field = [];

const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const flagsElement = document.getElementById('flags-count');
const restartButton = document.getElementById('restart-button');
const messageElement = document.getElementById('game-message');

function createEmptyField(rows, cols) {

    const newField = [];

    for (let row = 0; row < rows; row++) {

        const currentRow = [];

        for (let col = 0; col < cols; col++) {

            currentRow.push({
                type: 'empty',
                neighborMines: 0,
                state: 'closed',
            });

        }

        newField.push(currentRow);

    }

    return newField;
}

function generateField(rows, cols, minesCount) {

    field = createEmptyField(rows, cols);

    let placedMines = 0;

    while (placedMines < minesCount) {

        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type !== 'mine') {

            field[randomRow][randomCol].type = 'mine';

            placedMines++;

        }

    }

    countNeighbourMines();
}

function isValidCell(row, col) {

    return (
        row >= 0 &&
        row < gameState.rows &&
        col >= 0 &&
        col < gameState.cols
    );

}

function countNeighbourMines() {

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            if (field[row][col].type === 'mine') {
                continue;
            }

            let minesCounter = 0;

            for (let dRow = -1; dRow <= 1; dRow++) {

                for (let dCol = -1; dCol <= 1; dCol++) {

                    const neighbourRow = row + dRow;
                    const neighbourCol = col + dCol;

                    if (
                        isValidCell(neighbourRow, neighbourCol) &&
                        field[neighbourRow][neighbourCol].type === 'mine'
                    ) {
                        minesCounter++;
                    }

                }

            }

            field[row][col].neighborMines = minesCounter;

        }

    }

}

function openCell(row, col) {

    if (!isValidCell(row, col)) {
        return;
    }

    const cell = field[row][col];

    if (
        cell.state === 'opened' ||
        cell.state === 'flagged'
    ) {
        return;
    }

    cell.state = 'opened';

    if (cell.type === 'mine') {

        cell.state = 'exploded';

        gameState.status = 'lose';

        revealMines();

        stopTimer();

        renderField();

        messageElement.textContent = 'Ви програли';

        return;
    }

    if (cell.neighborMines === 0) {

        for (let dRow = -1; dRow <= 1; dRow++) {

            for (let dCol = -1; dCol <= 1; dCol++) {

                if (dRow === 0 && dCol === 0) {
                    continue;
                }

                openCell(row + dRow, col + dCol);

            }

        }

    }

    checkWin();

    renderField();
}

function revealMines() {

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            if (field[row][col].type === 'mine') {

                if (field[row][col].state !== 'exploded') {
                    field[row][col].state = 'opened';
                }

            }

        }

    }

}

function toggleFlag(row, col) {

    if (gameState.status !== 'process') {
        return;
    }

    const cell = field[row][col];

    if (cell.state === 'opened') {
        return;
    }

    if (cell.state === 'closed') {

        cell.state = 'flagged';

    } else if (cell.state === 'flagged') {

        cell.state = 'closed';

    }

    updateFlagsCounter();

    renderField();
}

function checkWin() {

    let openedCells = 0;

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            if (field[row][col].state === 'opened') {
                openedCells++;
            }

        }

    }

    const safeCells =
        (gameState.rows * gameState.cols) - gameState.minesCount;

    if (openedCells === safeCells) {

        gameState.status = 'win';

        stopTimer();

        messageElement.textContent = 'Ви перемогли';

    }

}

function renderField() {

    boardElement.innerHTML = '';

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            const cell = field[row][col];

            const cellElement = document.createElement('div');

            cellElement.classList.add('cell');

            if (cell.state === 'closed') {

                cellElement.classList.add('closed');

            }

            if (cell.state === 'flagged') {

                cellElement.classList.add('flag');

            }

            if (cell.state === 'opened') {

                if (cell.type === 'mine') {

                    cellElement.classList.add('mine');

                } else {

                    cellElement.classList.add('opened');

                    if (cell.neighborMines > 0) {

                        cellElement.textContent =
                            cell.neighborMines;

                        cellElement.classList.add(
                            `number-${cell.neighborMines}`
                        );

                    }

                }

            }

            if (cell.state === 'exploded') {

                cellElement.classList.add('exploded');

                cellElement.textContent = '💣';

            }

            cellElement.addEventListener('click', () => {

                if (gameState.status === 'process') {
                    openCell(row, col);
                }

            });

            cellElement.addEventListener('contextmenu', (event) => {

                event.preventDefault();

                toggleFlag(row, col);

            });

            boardElement.appendChild(cellElement);

        }

    }

}

function startTimer() {

    stopTimer();

    gameState.timerId = setInterval(() => {

        gameState.gameTime++;

        timerElement.textContent = gameState.gameTime;

    }, 1000);

}

function stopTimer() {

    clearInterval(gameState.timerId);

}

function updateFlagsCounter() {

    let flags = 0;

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            if (field[row][col].state === 'flagged') {
                flags++;
            }

        }

    }

    flagsElement.textContent =
        gameState.minesCount - flags;

}

function startGame() {

    gameState.status = 'process';

    gameState.gameTime = 0;

    timerElement.textContent = '0';

    messageElement.textContent = '';

    generateField(
        gameState.rows,
        gameState.cols,
        gameState.minesCount
    );

    renderField();

    updateFlagsCounter();

    startTimer();
}

restartButton.addEventListener('click', startGame);

startGame();

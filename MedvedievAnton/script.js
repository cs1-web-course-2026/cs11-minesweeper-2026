const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process',
    gameTime: 0,
    timerId: null,
};

let field = [];

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
        gameState.status = 'lose';
        stopTimer();

        console.log('Гру програно');

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
}

function toggleFlag(row, col) {

    if (!isValidCell(row, col)) {
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

}

function checkWin() {

    let closedCells = 0;

    for (let row = 0; row < gameState.rows; row++) {

        for (let col = 0; col < gameState.cols; col++) {

            if (field[row][col].state !== 'opened') {
                closedCells++;
            }

        }

    }

    if (closedCells === gameState.minesCount) {
        gameState.status = 'win';

        stopTimer();

        console.log('Гру виграно');
    }

}

function startTimer() {

    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);

}

function stopTimer() {

    clearInterval(gameState.timerId);

}

function startGame() {

    gameState.status = 'process';
    gameState.gameTime = 0;

    generateField(
        gameState.rows,
        gameState.cols,
        gameState.minesCount
    );

    startTimer();
}

startGame();

console.log(field);

openCell(0, 0);

toggleFlag(1, 1);

console.log(gameState);
